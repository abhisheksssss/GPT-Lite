# existing imports
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse, StreamingResponse
from pydantic import BaseModel
import torch
from pathlib import Path
from app.model import GPTModel
from app.config import BASE_CONFIG
from fastapi.middleware.cors import CORSMiddleware
# from generate import generate

from app.generate import generate, generate_stream
from app.model import (
    text_to_token_ids,
    token_ids_to_text,
    tokenizer
)


device=torch.device(
    "cuda" if torch.cuda.is_available()
    else "cpu"
)

model = GPTModel(BASE_CONFIG)

# Resolve checkpoint path relative to this file (project root/LLM-355M/checkpoints)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHECKPOINT_PATH = PROJECT_ROOT / "checkpoints" / "full_merged_model.pth"

if not CHECKPOINT_PATH.exists():
    raise FileNotFoundError(
        f"Checkpoint not found: {CHECKPOINT_PATH!s}.\n"
        "Place the checkpoint file at this location or update CHECKPOINT_PATH in app/main.py"
    )

state = torch.load(str(CHECKPOINT_PATH), map_location=device)
model.load_state_dict(state)
model.to(device)
# Reproducible generation
torch.manual_seed(123)

from typing import Optional


class PromptRequest(BaseModel):
    # Accept either a plain prompt string, or structured fields `instruction` and `input`.
    prompt: Optional[str] = None
    instruction: Optional[str] = None
    input: Optional[str] = ""
    max_new_tokens: int = 100
    stream: bool = False
    temperature: float = 0.8
    top_k: Optional[int] = 40
    repetition_penalty: float = 1.1

model.eval()

app=FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_input(entry):
    # Accept either a plain string prompt or a dict with 'instruction' and 'input'
    if isinstance(entry, str):
        instruction = entry
        input_field = ""
    elif isinstance(entry, dict):
        instruction = entry.get("instruction", "")
        input_field = entry.get("input", "")
    else:
        instruction = str(entry)
        input_field = ""

    instruction_text = (
        "Below is an instruction that describes a task. "
        "Write a response that appropriately completes the request."
        f"\n\n### Instruction:\n{instruction}"
    )
    input_text = f"\n\n### Input:\n{input_field}" if input_field else ""

    return instruction_text + input_text


@app.get("/")
def home():
    return{
        "message":"Gpt Server Running"
    }

@app.post("/genrate")
def generate_test(request:PromptRequest):

    # Build the input for the model from either structured fields or a plain prompt
    if request.instruction is not None:
        input_text = format_input({"instruction": request.instruction, "input": request.input or ""})
    elif request.prompt is not None:
        input_text = format_input(request.prompt)
    else:
        return {"error": "no prompt or instruction provided"}
    try:
        if request.stream:
            idx = text_to_token_ids(input_text, tokenizer).to(device)

            def token_generator():
                for next_token in generate_stream(
                    model=model,
                    idx=idx,
                    max_new_tokens=request.max_new_tokens,
                    context_size=BASE_CONFIG["context_length"],
                    eos_id=50256,
                    temperature=request.temperature,
                    top_k=request.top_k,
                    repetition_penalty=request.repetition_penalty
                ):
                    token_id = int(next_token.item())
                    yield tokenizer.decode([token_id])

            return StreamingResponse(token_generator(), media_type="text/plain")

        token_ids = generate(
            model=model,
            idx=text_to_token_ids(input_text,tokenizer).to(device),
            max_new_tokens=request.max_new_tokens,
            context_size=BASE_CONFIG["context_length"],
            eos_id=50256,
            temperature=request.temperature,
            top_k=request.top_k,
            repetition_penalty=request.repetition_penalty
        )
        generated_text = token_ids_to_text(token_ids,tokenizer)
        # extract the model response after the input prompt
        remainder = generated_text[len(input_text):]
        if "### Response:" in remainder:
            response_text = remainder.split("### Response:", 1)[1].strip()
        else:
            response_text = remainder.strip()
        print(input_text)
        print(f"Model response:\n{response_text}")
        return PlainTextResponse(response_text)
    except Exception as e:
        return {"error": str(e)}