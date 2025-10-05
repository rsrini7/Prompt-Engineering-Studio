# LangChain Hub has moved to LangSmith - using LangSmith Client
try:
    from langsmith import Client
    LANGSMITH_AVAILABLE = True
except ImportError:
    LANGSMITH_AVAILABLE = False
    print("LangSmith not available, using fallback templates")

from ..models.analysis import PatternMatch
from typing import List, Dict
import re
import dspy
from ..services.dspy_service import DspyService
import os

# Local template repository with popular LangSmith templates
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

# This maps our internal pattern names to popular LangSmith prompts.
# Updated to use LangSmith format: "owner/repo-name"
PATTERN_TO_HUB_MAP = {
    "rag": ["rlm/rag-prompt", "langchain-ai/retrieval-qa-chat"],
    "react": ["hwchase17/react-chat", "hwchase17/react-json"],
    "chain_of_thought": ["rlm/rag-prompt-cot"],
    "role_prompting": ["hwchase17/react-chat", "rlm/rag-prompt"],
}

# Template content cache for better performance
TEMPLATE_CACHE = {}

class HubService:
    def get_suggestions(self, detected_patterns: Dict[str, PatternMatch]) -> List[dict]:
        if not detected_patterns:
            return []

        # Find all unique template names suggested by the detected patterns
        suggested_slugs = set()
        for pattern_name in detected_patterns.keys():
            if pattern_name in PATTERN_TO_HUB_MAP:
                for slug in PATTERN_TO_HUB_MAP[pattern_name]:
                    suggested_slugs.add(slug)

        # Calculate the total confidence score of all detected patterns
        total_confidence = sum(p.confidence for p in detected_patterns.values())
        if total_confidence == 0:
            return []

        # Score each unique template
        ranked_suggestions = []
        for slug in suggested_slugs:
            # For now, we assume the template exists. A real implementation might check this.
            # We determine which of our patterns are associated with this slug.
            matched_pattern_names = {
                p_name for p_name, s_list in PATTERN_TO_HUB_MAP.items() if slug in s_list
            }

            # Sum the confidences of only the patterns that were detected AND match this slug
            matched_confidence = sum(
                p.confidence for name, p in detected_patterns.items() if name in matched_pattern_names
            )

            # Calculate score using the approved formula
            score = (matched_confidence / total_confidence) * 100
            
            ranked_suggestions.append({"name": slug, "score": round(score, 2)})

        # Sort suggestions from highest score to lowest
        ranked_suggestions.sort(key=lambda x: x["score"], reverse=True)

        return ranked_suggestions

    def get_template_content(self, template_slug: str) -> str:
        """
        Fetch the actual content of a template using LangSmith or local repository.

        Args:
            template_slug: The template slug (e.g., "rlm/rag-prompt")

        Returns:
            The template content as a string
        """
        if template_slug in TEMPLATE_CACHE:
            return TEMPLATE_CACHE[template_slug]

        # Try to fetch from LangSmith if available
        if LANGSMITH_AVAILABLE:
            try:
                # Check if LangSmith API key is available
                langsmith_api_key = os.getenv("LANGSMITH_API_KEY")
                if not langsmith_api_key:
                    print("LangSmith API key not found in environment variables, using local templates")
                else:
                    print(f"Attempting to fetch {template_slug} from LangSmith...")
                    client = Client()
                    prompt = client.pull_prompt(template_slug)
                    content = str(prompt)
                    print(f"Successfully fetched {template_slug} from LangSmith")

                    # Cache the template content
                    TEMPLATE_CACHE[template_slug] = content
                    return content

            except Exception as e:
                print(f"Failed to fetch template {template_slug} from LangSmith: {e}")
                print("Using local templates as fallback")

        # Use local template repository as fallback
        if template_slug in LOCAL_TEMPLATES:
            content = LOCAL_TEMPLATES[template_slug]
            TEMPLATE_CACHE[template_slug] = content
            return content

        # Fallback for pattern-based template names
        if template_slug == "chain_of_thought":
            content = LOCAL_TEMPLATES["chain_of_thought"]
            TEMPLATE_CACHE[template_slug] = content
            return content

        # Generic fallback for unknown templates
        print(f"Template {template_slug} not found, using generic template")
        generic_content = f"""Template: {template_slug}

{{input}}

[Template content not available]"""
        TEMPLATE_CACHE[template_slug] = generic_content
        return generic_content

    def get_template_with_metadata(self, template_slug: str) -> Dict:
        """
        Get template content along with metadata like variables found.

        Args:
            template_slug: The template slug

        Returns:
            Dictionary with template content and metadata
        """
        content = self.get_template_content(template_slug)

        if not content:
            # Return a minimal template structure if no content available
            return {
                "content": f"Template: {template_slug}\n\n{{input}}\n\n[Template content not available]",
                "variables": ["input"],
                "slug": template_slug,
                "variable_count": 1,
                "error": "Template content not available, using placeholder"
            }

        # Extract variables (common patterns like {variable}, {{variable}}, etc.)
        variables = set(re.findall(r'\{([^}]+)\}', content))

        return {
            "content": content,
            "variables": list(variables) if variables else ["input"],
            "slug": template_slug,
            "variable_count": len(variables) if variables else 1
        }

    def merge_template_with_prompt(self, user_prompt: str, template_slug: str,
                                  provider: str = "ollama", model: str = "gemma:2b", api_key: str = "") -> str:
        """
        Intelligently merge user prompt content into a template using LLM.

        Args:
            user_prompt: The user's original prompt
            template_slug: The template to merge into
            provider: LLM provider for merging
            model: Model for merging
            api_key: API key if required

        Returns:
            The merged template with variables filled in
        """
        try:
            # Get template content and variables
            template_info = self.get_template_with_metadata(template_slug)
            template_content = template_info["content"]
            variables = template_info["variables"]

            if not template_content or not variables:
                return user_prompt  # Return original if template not available

            # Configure LLM for merging
            dspy_service = DspyService()
            llm = dspy_service.configure_llm(provider, model, api_key)

            # Create merging prompt
            variables_str = ", ".join(f'"{var}"' for var in variables)

            merge_prompt = f"""
You are an expert prompt engineer. Given the user's prompt and a template with variables, intelligently extract information from the user's prompt and fill in the template variables.

**User's Prompt:**
{user_prompt}

**Template:**
{template_content}

**Variables to fill:** {variables_str}

**Instructions:**
1. Analyze the user's prompt to understand its intent, context, and key elements
2. For each variable in the template, determine what content from the user's prompt should fill it
3. If a variable doesn't have a clear mapping, use your best judgment to infer appropriate content
4. Return only the completed template with variables filled in
5. Maintain the template's structure and formatting

**Response Format:**
Return only the filled-in template text, no explanations or additional content.
"""

            # Use DSPy to get LLM response
            with dspy.context(lm=llm):
                try:
                    # Create a simple signature for template merging
                    class TemplateMergeSignature(dspy.Signature):
                        """Merge user prompt into template."""
                        merge_prompt = dspy.InputField()
                        merged_template = dspy.OutputField(desc="The template with variables filled in")

                    merge_program = dspy.Predict(TemplateMergeSignature)
                    response = merge_program(merge_prompt=merge_prompt)

                    # Check if response is valid
                    if response and response.merged_template:
                        merged_content = response.merged_template.strip()

                        # Basic validation - ensure we got a reasonable response
                        if len(merged_content) > 50 and any(var in merged_content for var in variables):
                            return merged_content
                        else:
                            # If LLM response seems poor, return original prompt
                            print("LLM template merging produced poor result, returning original prompt")
                            return user_prompt
                    else:
                        # If LLM response is None or empty, return original prompt
                        print("LLM template merging returned None or empty response, returning original prompt")
                        return user_prompt

                except Exception as e:
                    print(f"Template merging failed: {e}")
                    return user_prompt

        except Exception as e:
            print(f"Template merging error: {e}")
            return user_prompt