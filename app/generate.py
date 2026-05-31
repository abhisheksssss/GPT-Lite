import torch



def generate(model,idx,max_new_tokens,context_size,temperature=0.0,top_k=None,eos_id=None,repetition_penalty=1.0):

    for _ in range(max_new_tokens):
        idx_cond=idx[:,-context_size:]
        with torch.no_grad():
            logits=model(idx_cond)
        logits=logits[:,-1,:]

        if repetition_penalty and repetition_penalty != 1.0:
            # Penalize tokens that already appeared in the sequence
            for b in range(logits.size(0)):
                for token_id in idx[b].tolist():
                    if logits[b, token_id] < 0:
                        logits[b, token_id] *= repetition_penalty
                    else:
                        logits[b, token_id] /= repetition_penalty

        if top_k is not None:
            top_logits,_=torch.topk(logits,top_k)
            min_val=top_logits[:,-1]
            logits=torch.where(logits<min_val,torch.tensor(float("-inf")).to(logits.device),logits)
        
        if temperature>0.0:
            logits=logits/temperature

            probs=torch.softmax(logits,dim=-1)

            idx_next=torch.multinomial(probs,num_samples=2)

        else:
            idx_next=torch.argmax(logits,dim=-1,keepdim=True)

        if idx_next==eos_id:
            break

        idx=torch.cat((idx,idx_next),dim=1)

    return idx


def generate_stream(model, idx, max_new_tokens, context_size, temperature=0.0, top_k=None, eos_id=None, repetition_penalty=1.0):
    for _ in range(max_new_tokens):
        idx_cond = idx[:, -context_size:]
        with torch.no_grad():
            logits = model(idx_cond)
        logits = logits[:, -1, :]

        if repetition_penalty and repetition_penalty != 1.0:
            for b in range(logits.size(0)):
                for token_id in idx[b].tolist():
                    if logits[b, token_id] < 0:
                        logits[b, token_id] *= repetition_penalty
                    else:
                        logits[b, token_id] /= repetition_penalty

        if top_k is not None:
            top_logits, _ = torch.topk(logits, top_k)
            min_val = top_logits[:, -1]
            logits = torch.where(logits < min_val, torch.tensor(float("-inf")).to(logits.device), logits)

        if temperature > 0.0:
            logits = logits / temperature
            probs = torch.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
        else:
            idx_next = torch.argmax(logits, dim=-1, keepdim=True)

        if eos_id is not None and idx_next.item() == eos_id:
            break

        idx = torch.cat((idx, idx_next), dim=1)
        yield idx_next
