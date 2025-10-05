from fastapi import APIRouter, HTTPException, Form
from ..models.templates import SuggestionRequest, SuggestionResponse, TemplateMergeRequest, TemplateMergeResponse
from ..services.hub_service import HubService
from typing import Optional
import re

router = APIRouter()
hub_service = HubService()

# Define LOCAL_TEMPLATES directly to avoid import issues
LOCAL_TEMPLATES = {
    "hwchase17/react-chat": """Thought: {thought}
Action: {action}
Observation: {observation}

... (repeat until task is solved)

Final Answer: {final_answer}""",

    "rlm/rag-prompt": """Use the following pieces of context to answer the question at the end.

Context:
{context}

Question: {question}

Helpful Answer:""",

    "hwchase17/react-json": """Thought: {thought}
Action: {action}
Observation: {observation}

... (repeat as needed)

Final Answer: {final_answer}""",

    "rlm/rag-prompt-cot": """Use the following pieces of context to answer the question at the end. Let's think step by step.

Context:
{context}

Question: {question}

Step by step reasoning:
1. {step1}
2. {step2}
3. {step3}

Final Answer:""",

    "langchain-ai/retrieval-qa-chat": """You are an AI assistant helping answer questions based on provided context.

Context:
{context}

Question: {question}

Please provide a helpful and accurate answer based on the context above.""",

    "hwchase17/react": """Question: {question}

Thought: {thought}
Action: {action}
Observation: {observation}

Final Answer: {answer}""",

    "chain_of_thought": """Let's solve this step by step:

1. First, understand the problem
2. Break it down into smaller parts
3. Work through each part systematically
4. Combine the results

Question: {question}

Answer: {answer}""",

    "few_shot": """Here are some examples:

Example 1:
Input: {example1_input}
Output: {example1_output}

Example 2:
Input: {example2_input}
Output: {example2_output}

Now solve this:
Input: {input}
Output:""",

    "role_prompting": """You are a {role} with expertise in {domain}.

Task: {task}

Instructions: {instructions}

Please provide your response:"""
}

@router.post("/templates/suggest", response_model=SuggestionResponse, tags=["Templates"])
async def suggest_templates(request: SuggestionRequest):
    """
    Suggests LangChain Hub templates based on detected prompt patterns.
    """
    try:
        suggestions = hub_service.get_suggestions(request.patterns)
        return SuggestionResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/templates/merge", response_model=TemplateMergeResponse, tags=["Templates"])
async def merge_template(
    user_prompt: str = Form(...),
    template_slug: str = Form(...),
    provider: str = Form("ollama"),
    model: str = Form("gemma:2b"),
    api_key: str = Form("")
):
    """
    Intelligently merge user prompt content into a selected template.
    """
    try:
        merged_template = hub_service.merge_template_with_prompt(
            user_prompt=user_prompt,
            template_slug=template_slug,
            provider=provider,
            model=model,
            api_key=api_key
        )
        return TemplateMergeResponse(merged_template=merged_template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates/content/{template_slug:path}", tags=["Templates"])
async def get_template_content(template_slug: str):
    """
    Get the content and metadata of a specific template.
    """
    print(f"🚀 TEMPLATE ENDPOINT CALLED for: {template_slug}")
    print(f"📋 Available templates: {list(LOCAL_TEMPLATES.keys())}")

    # Direct template access - this should work
    if template_slug in LOCAL_TEMPLATES:
        print(f"✅ FOUND {template_slug} in LOCAL_TEMPLATES!")
        content = LOCAL_TEMPLATES[template_slug]
        variables = set(re.findall(r'\{([^}]+)\}', content))
        return {
            "content": content,
            "variables": list(variables),
            "slug": template_slug,
            "variable_count": len(variables)
        }
    else:
        print(f"❌ {template_slug} NOT FOUND in LOCAL_TEMPLATES")
        # Return a fallback response instead of 404
        return {
            "content": f"Template '{template_slug}' not found. Available templates: {', '.join(LOCAL_TEMPLATES.keys())}",
            "variables": ["input"],
            "slug": template_slug,
            "variable_count": 1,
            "error": "Template not found"
        }

# Add a simple test endpoint to verify router is working
@router.get("/templates/test", tags=["Templates"])
async def test_templates():
    """Test endpoint to verify templates router is working."""
    return {
        "status": "ok",
        "message": "Templates router is working",
        "available_templates": list(LOCAL_TEMPLATES.keys())
    }