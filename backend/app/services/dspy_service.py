import dspy
import pandas as pd
import io
from typing import List

# 1. Define a simple signature for our task
class BasicQASignature(dspy.Signature):
    """Answer the question."""
    question = dspy.InputField()
    answer = dspy.OutputField()

class DspyService:
    def __init__(self):
        # Configure the LLM. This points to a local Ollama model.
        # Ensure you have Ollama running with a model like 'llama3' or 'gemma:2b'.
        lm = dspy.LM('ollama_chat/gemma:2b', api_base='http://localhost:11434', api_key='')
        dspy.configure(lm=lm)

    def optimize_prompt(self, original_prompt: str, file_content: bytes, filename: str) -> str:
        # 1. Load the dataset
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith('.jsonl'):
            df = pd.read_json(io.BytesIO(file_content), lines=True)
        else:
            raise ValueError("Unsupported file type. Please use .csv or .jsonl")
        
        train_set = [dspy.Example(question=row['question'], answer=row['answer']).with_inputs('question') for _, row in df.iterrows()]

        # 2. Define the program to optimize
        class BasicQAProgram(dspy.Module):
            def __init__(self):
                super().__init__()
                self.predictor = dspy.Predict(BasicQASignature, instructions=original_prompt)

            def forward(self, question):
                return self.predictor(question=question)

        # 3. Set up the optimizer
        from dspy.teleprompt import BootstrapFewShot
        config = dict(max_bootstrapped_demos=4, max_labeled_demos=4)
        teleprompter = BootstrapFewShot(metric=dspy.evaluate.answer_exact_match, **config)
        optimized_program = teleprompter.compile(BasicQAProgram(), trainset=train_set)

        # 4. Retrieve the learned demonstrations from the optimized predictor
        demos = optimized_program.predictor.demos
        
        # Format the demos into a human-readable string
        example_string = ""
        for demo in demos:
            example_string += f"Question: {demo.question}\n"
            example_string += f"Answer: {demo.answer}\n\n"
            
        # The new "optimized prompt" is the original instruction plus the learned examples
        optimized_prompt = f"{original_prompt}\n\n--- Examples ---\n{example_string}"
        
        return optimized_prompt