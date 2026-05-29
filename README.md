# 🚀 LLM-355M

A GPT-style Large Language Model built from scratch using PyTorch, integrated with pretrained GPT-2 Medium (355M) weights for instruction-following text generation.

This project demonstrates:

* Building a decoder-only Transformer architecture from scratch
* Loading pretrained GPT-2 weights
* Fine-tuning and evaluation workflows
* Serving the model through a FastAPI backend

---

# 📂 Project Structure

```bash
LLM-355M/
│
├── app/                     # FastAPI inference server
│   └── main.py
│
├── checkpoints/             # Model checkpoints
│   └── LLM.pth
│
├── requirements.txt         # Project dependencies
│
├── LLM.ipynb                # Training, evaluation, and GPT-2 loading workflow
│
└── README.md
```

---

# 🧠 Model Architecture

The model is a **decoder-only Transformer** implemented completely from scratch.

### Features

* Token Embeddings
* Positional Embeddings
* Multi-Head Self Attention
* Feed Forward Networks
* Residual Connections
* Layer Normalization
* Autoregressive Next Token Prediction

---

# ⚡ Loading GPT-2 Medium (355M) Weights

The notebook demonstrates how pretrained GPT-2 weights are downloaded and loaded into the custom Transformer implementation.

## Configuration Example

```python
from gpt_download3 import download_and_load_gpt2

BASE_CONFIG = {
    "vocab_size": 50257,
    "context_length": 1024,
    "drop_rate": 0.0,
    "qkv_bias": True
}

model_configs = {
    "gpt2-medium (355M)": {
        "emb_dim": 1024,
        "n_layers": 24,
        "n_heads": 16
    },
}

CHOOSE_MODEL = "gpt2-medium (355M)"

BASE_CONFIG.update(model_configs[CHOOSE_MODEL])

model_size = CHOOSE_MODEL.split(" ")[-1].lstrip("(").rstrip(")")

settings, params = download_and_load_gpt2(
    model_size=model_size,
    models_dir="gpt2"
)

model = GPTModel(BASE_CONFIG)

load_weights_into_gpt(model, params)

model.eval()
```

---

# 📊 Training & Evaluation

The `LLM.ipynb` notebook includes:

* Transformer implementation from scratch
* GPT-2 weight loading
* Fine-tuning workflow
* Loss evaluation
* Instruction-following generation
* Inference testing

---

# 🛠️ Installation

## 1️⃣ Clone the Repository

```bash
git clone <your-repository-url>
cd LLM-355M
```

## 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 📥 Add Model Checkpoint

Download Model weight LLM.pth from Hugging Face : https://huggingface.co/abhishek001001/GPT-355M/tree/main

Place your trained checkpoint inside:

```bash
checkpoints/
```

Example:

```bash
checkpoints/gpt2-medium-355M-sft.pth
```

---

# ▶️ Run the FastAPI Server

```bash
uvicorn app.main:app --reload
```

Server will start at:

```bash
http://127.0.0.1:8000
```

---

# 📡 API Usage

## Endpoint

```http
POST /generate
```

---

## Structured Instruction Input

```json
{
  "instruction": "Correct the sentence.",
  "input": "Me and my friend went to the store.",
  "max_new_tokens": 40
}
```

---

## Plain Prompt Input

```json
{
  "prompt": "Correct the sentence: Me and my friend went to the store.",
  "max_new_tokens": 40
}
```

---

# ✅ Example Response

```text
My friend and I went to the store.
```

---

# 📌 Notes

* Large checkpoints and generated artifacts are excluded using `.gitignore`
* Update `CHECKPOINT_PATH` inside `app/main.py` if using a different model filename
* Ensure sufficient RAM/VRAM for loading GPT-2 Medium (355M)

---

# 🔮 Future Improvements

* Streaming token generation
* Quantization support
* LoRA fine-tuning
* Hugging Face integration
* Docker deployment
* Web UI for inference

---

# 📜 License

This project is for educational and research purposes.

```
```
