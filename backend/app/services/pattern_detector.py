import re
from typing import List, Dict, Tuple
from dataclasses import dataclass
import json
import dspy
from ..services.dspy_service import DspyService

from ..models.analysis import PatternMatch

class AdvancedPromptPatternDetector:
    """
    Detect prompt engineering patterns based on:
    - promptingguide.ai techniques
    - Common prompt engineering patterns
    """
    
    def __init__(self):
        self.patterns = {
            # Basic Patterns
            'zero_shot': {
                'keywords': [],
                'negative_keywords': [r'example', r'for instance', r'like this'],
                'description': 'Direct task without examples',
                'category': 'Basic'
            },
            'few_shot': {
                'keywords': [r'here are examples', r'example:', r'for instance', 
                           r'like this:', r'sample:', r'input:.*output:'],
                'description': 'Provides examples before the task',
                'category': 'Basic'
            },
            'role_prompting': {
                'keywords': [r'you are a', r'act as', r'you are an', r'assume the role'],
                'description': 'Assigns a specific role or persona',
                'category': 'Basic'
            },
            
            # Advanced Reasoning
            'chain_of_thought': {
                'keywords': [r'step by step', r'think through', r'reason about', 
                           r"let\'s think", r'work through', r'explain your reasoning'],
                'description': 'Encourages step-by-step reasoning (CoT)',
                'category': 'Reasoning'
            },
            'self_consistency': {
                'keywords': [r'multiple.*reasoning', r'different.*approaches', 
                           r'various.*solutions', r'compare.*answers'],
                'description': 'Generates multiple reasoning paths',
                'category': 'Reasoning'
            },
            'tree_of_thoughts': {
                'keywords': [r'explore.*options', r'branch.*possibilities', 
                           r'different paths', r'evaluate.*alternatives'],
                'description': 'Explores multiple reasoning branches (ToT)',
                'category': 'Reasoning'
            },
            'generate_knowledge': {
                'keywords': [r'first.*generate.*knowledge', r'what do you know about',
                           r'provide background', r'recall.*information'],
                'description': 'Generates relevant knowledge before answering',
                'category': 'Reasoning'
            },
            
            # Agent Patterns
            'react': {
                'keywords': [r'thought:', r'action:', r'observation:', 
                           r'reason.*then.*act', r'plan.*execute'],
                'description': 'Reasoning + Acting pattern (ReAct)',
                'category': 'Agent'
            },
            'reflexion': {
                'keywords': [r'reflect on', r'self-reflect', r'evaluate your',
                           r'what went wrong', r'how to improve', r'self-assess',
                           r'analyze.*performance', r'critique.*yourself',
                           r'improve.*reasoning', r'better.*response',
                           r'self-critique', r'critique your answer',
                           r'review and critique',
                           r'identify.*errors', r'logical.*errors'],
                'description': 'AI self-reflection: AI evaluates its own outputs and performance',
                'category': 'Agent'
            },
            'automatic_reasoning': {
                'keywords': [r'use tools', r'available functions', r'call.*function',
                           r'external tools'],
                'description': 'Automatic Reasoning and Tool-use (ART)',
                'category': 'Agent'
            },
            
            # Retrieval & Context
            'rag': {
                'keywords': [r'based on.*context', r'using.*document', r'retrieve',
                           r'search.*then.*answer', r'given.*information'],
                'description': 'Retrieval Augmented Generation (RAG)',
                'category': 'Retrieval'
            },
            'active_prompt': {
                'keywords': [r'most uncertain', r'need clarification', r'ask questions',
                           r'what else.*need'],
                'description': 'Actively seeks clarification',
                'category': 'Retrieval'
            },
            
            # Output Control
            'directional_stimulus': {
                'keywords': [r'focus on', r'emphasize', r'pay attention to',
                           r'highlight', r'prioritize'],
                'description': 'Guides attention to specific aspects',
                'category': 'Control'
            },
            'constraint_setting': {
                'keywords': [r'must include', r'do not', r'avoid', r'only',
                           r'ensure that', r'specifically', r'focus on', r'focusing on'],
                'description': 'Sets boundaries or requirements',
                'category': 'Control'
            },
            'task_decomposition': {
                'keywords': [r'review and critique', r'provide.*feedback', r'offer.*suggestions',
                           r'break.*down', r'step by step', r'analyze.*then'],
                'description': 'Breaks down complex tasks into specific components',
                'category': 'Control'
            },
            'output_formatting': {
                'keywords': [r'format', r'structure', r'provide in', r'output as',
                           r'json', r'table', r'list', r'markdown'],
                'description': 'Specifies desired output format',
                'category': 'Control'
            },
            
            # Meta Patterns
            'meta_prompting': {
                'keywords': [r'improve.*prompt', r'better.*question', r'rewrite.*query',
                           r'optimize.*instruction'],
                'description': 'Prompts about prompts',
                'category': 'Meta'
            },
            'automatic_prompt_engineer': {
                'keywords': [r'generate.*prompt', r'create.*instruction', 
                           r'design.*template'],
                'description': 'Automatic Prompt Engineering (APE)',
                'category': 'Meta'
            },
            
            # Multimodal
            'multimodal_cot': {
                'keywords': [r'analyze.*image', r'visual.*reasoning', r'describe.*then',
                           r'based on.*picture'],
                'description': 'Chain-of-Thought with multimodal inputs',
                'category': 'Multimodal'
            },
            
            # Traditional Patterns
            'task_specification': {
                'keywords': [r'generate', r'create', r'write', r'analyze', 
                           r'review', r'explain', r'summarize'],
                'description': 'Clearly defines the task',
                'category': 'Basic'
            },
            'iterative_refinement': {
                'keywords': [r'if.*feedback', r'refine', r'enhance', r'iterate',
                           r'improve.*previous'],
                'description': 'Includes feedback loop instructions',
                'category': 'Control'
            },
            'persona_context': {
                'keywords': [r'known for', r'expert in', r'specialized',
                           r'with experience'],
                'description': 'Adds context or credentials to the role',
                'category': 'Basic'
            },
            'goal_oriented': {
                'keywords': [r'goal', r'objective', r'aim', r'purpose',
                           r'for maximum', r'to ensure'],
                'description': 'Defines success criteria',
                'category': 'Control'
            },
            'audience_awareness': {
                'keywords': [r'audience', r'reader', r'for.*users', r'target'],
                'description': 'Considers the end audience',
                'category': 'Control'
            },

            # Content Analysis & Critique (Peer Review)
            'peer_review': {
                'keywords': [r'review.*tweet', r'critique.*content', r'feedback.*post',
                           r'analyze.*writing', r'evaluate.*message', r'assess.*communication',
                           r'content.*review', r'writing.*feedback', r'social.*media.*analysis',
                           r'provide.*feedback', r'constructive.*criticism',
                           r'review and critique', r'provide constructive feedback',
                           r'offer specific suggestions', r'make.*compelling',
                           r'enhancing.*depth', r'overall.*impact'],
                'description': 'Content critique: AI analyzes and evaluates external content',
                'category': 'Analysis'
            }
        }
    
    def detect_patterns(self, prompt: str) -> dict[str, PatternMatch]:
        """Detect all patterns in a given prompt"""
        prompt_lower = prompt.lower()
        detected = {}

        for pattern_name, pattern_info in self.patterns.items():
            matches = []
            confidence = 0.0

            # Special handling for zero-shot
            if pattern_name == 'zero_shot':
                is_few_shot = any(re.search(kw, prompt_lower) for kw in self.patterns['few_shot']['keywords'])
                if not is_few_shot:
                    detected[pattern_name] = PatternMatch(
                        pattern=pattern_name,
                        confidence=0.7,
                        evidence=["No clear examples found, suggesting a zero-shot approach."],
                        description=pattern_info['description'],
                        category=pattern_info['category']
                    )
                continue

            # Check for keyword matches
            for keyword in pattern_info.get('keywords', []):
                regex_matches = re.finditer(keyword, prompt_lower, re.IGNORECASE)
                for match in regex_matches:
                    start = max(0, match.start() - 30)
                    end = min(len(prompt), match.end() + 30)
                    context = prompt[start:end].strip()
                    matches.append(f"...{context}...")
                    confidence += 0.35

            if matches:
                confidence = min(confidence, 1.0)
                detected[pattern_name] = PatternMatch(
                    pattern=pattern_name,
                    confidence=confidence,
                    evidence=matches[:3],
                    description=pattern_info['description'],
                    category=pattern_info['category']
                )

        return detected
    
    def analyze_prompt(self, prompt: str, format_type: str = "text") -> str:
        """
        Provide detailed analysis of the prompt
        format_type: 'text', 'json', or 'markdown'
        """
        patterns = self.detect_patterns(prompt)
        
        if format_type == "json":
            return self._format_json(prompt, patterns)
        elif format_type == "markdown":
            return self._format_markdown(prompt, patterns)
        else:
            return self._format_text(prompt, patterns)
    
    def _format_text(self, prompt: str, patterns: Dict[str, PatternMatch]) -> str:
        """Format as plain text"""
        if not patterns:
            return "No clear prompt patterns detected."
        
        report = "=" * 60 + "\n"
        report += "PROMPT PATTERN ANALYSIS\n"
        report += "=" * 60 + "\n\n"
        report += f"Prompt Length: {len(prompt)} characters\n"
        report += f"Patterns Detected: {len(patterns)}\n\n"
        
        # Group by category
        by_category = {}
        for name, match in patterns.items():
            cat = match.category
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append((name, match))
        
        # Display by category
        for category in ['Basic', 'Reasoning', 'Agent', 'Retrieval', 'Control', 'Meta', 'Multimodal', 'Analysis']:
            if category not in by_category:
                continue
            
            report += f"\n{'=' * 60}\n"
            report += f"📂 {category.upper()} PATTERNS\n"
            report += f"{'=' * 60}\n\n"
            
            sorted_patterns = sorted(
                by_category[category],
                key=lambda x: x[1].confidence,
                reverse=True
            )
            
            for pattern_name, match in sorted_patterns:
                report += f"📌 {pattern_name.upper().replace('_', ' ')}\n"
                report += f"   Confidence: {match.confidence:.2f} | {self._confidence_bar(match.confidence)}\n"
                report += f"   Description: {match.description}\n"
                
                if match.evidence and match.evidence[0] != "No examples found in prompt":
                    report += f"   Evidence:\n"
                    for evidence in match.evidence:
                        report += f"      • {evidence}\n"
                report += "\n"
        
        return report
    
    def _format_json(self, prompt: str, patterns: Dict[str, PatternMatch]) -> str:
        """Format as JSON"""
        result = {
            "prompt_length": len(prompt),
            "patterns_detected": len(patterns),
            "patterns": {}
        }
        
        for name, match in patterns.items():
            result["patterns"][name] = {
                "confidence": round(match.confidence, 2),
                "description": match.description,
                "category": match.category,
                "evidence": match.evidence[:3]
            }
        
        return json.dumps(result, indent=2)
    
    def _format_markdown(self, prompt: str, patterns: Dict[str, PatternMatch]) -> str:
        """Format as Markdown"""
        report = "# Prompt Pattern Analysis\n\n"
        report += f"**Prompt Length:** {len(prompt)} characters\n\n"
        report += f"**Patterns Detected:** {len(patterns)}\n\n"
        
        by_category = {}
        for name, match in patterns.items():
            cat = match.category
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append((name, match))
        
        for category, items in by_category.items():
            report += f"\n## {category} Patterns\n\n"
            
            for pattern_name, match in items:
                report += f"### {pattern_name.replace('_', ' ').title()}\n\n"
                report += f"- **Confidence:** {match.confidence:.2f}\n"
                report += f"- **Description:** {match.description}\n\n"
                
                if match.evidence and match.evidence[0] != "No examples found in prompt":
                    report += "**Evidence:**\n"
                    for evidence in match.evidence:
                        report += f"- {evidence}\n"
                report += "\n"
        
        return report
    
    def _confidence_bar(self, confidence: float) -> str:
        """Visual confidence bar"""
        filled = int(confidence * 10)
        return "█" * filled + "░" * (10 - filled)
    
    def get_template(self, pattern_name: str) -> str:
        """Get a template for a specific pattern"""
        templates = {
            'chain_of_thought': """Let's solve this step by step:
1. [First, analyze...]
2. [Then, consider...]
3. [Finally, conclude...]""",
            
            'few_shot': """Here are some examples:
Input: [example 1 input]
Output: [example 1 output]

Input: [example 2 input]
Output: [example 2 output]

Now, for your input: [your input]""",
            
            'react': """Thought: [What should I think about this?]
Action: [What action should I take?]
Observation: [What did I observe?]
... (repeat until solved)
Final Answer: [conclusion]""",
            
            'rag': """Based on the following context:
[context from documents]

Answer the question: [question]""",
            
            'role_prompting': """You are a [specific role] with expertise in [domain].
Your task is to [specific task].
[Additional instructions]""",

            'peer_review': """You are a [role/expert] known for your [relevant characteristics].
Review and critique the user's [content type].
Provide constructive feedback, focusing on enhancing:
- [specific aspect 1]
- [specific aspect 2]
- [specific aspect 3]
Offer specific suggestions to make it more compelling and engaging for their audience.""",

            'task_decomposition': """Break down the task into specific components:
1. [First component - e.g., Review the content]
2. [Second component - e.g., Identify strengths]
3. [Third component - e.g., Provide suggestions]
4. [Final component - e.g., Summarize improvements]

Ensure each component is addressed thoroughly."""
        }
        
        return templates.get(pattern_name, "Template not available for this pattern.")

    def refine_patterns_with_llm(self, original_prompt: str, detected_patterns: Dict[str, PatternMatch],
                                provider: str = "ollama", model: str = "gemma:2b", api_key: str = None) -> Dict[str, PatternMatch]:
        """
        Use an LLM to refine pattern detection results.

        Args:
            original_prompt: The user's original prompt
            detected_patterns: Patterns detected by rule-based system
            provider: LLM provider ("ollama", "openrouter", "groq")
            model: Model name to use
            api_key: API key if required

        Returns:
            Refined pattern detection results
        """
        # Create meta-prompt for LLM review
        meta_prompt = self._create_refinement_meta_prompt(original_prompt, detected_patterns)

        try:
            # Configure LLM
            dspy_service = DspyService()
            llm = dspy_service.configure_llm(provider, model, api_key)

            # Create DSPy signature for pattern refinement
            class PatternRefinementSignature(dspy.Signature):
                """Refine prompt pattern detection results."""
                meta_prompt = dspy.InputField()
                refined_json = dspy.OutputField(desc="JSON object with refined pattern analysis")

            # Get LLM response using dspy.context
            try:
                with dspy.context(lm=llm):
                    try:
                        # Try modern DSPy syntax first
                        refinement_program = dspy.Predict(PatternRefinementSignature)
                        response = refinement_program(meta_prompt=meta_prompt)
                        refined_json = response.refined_json
                    except AttributeError:
                        # Fallback for different DSPy versions
                        refinement_program = dspy.Predict(PatternRefinementSignature)
                        response = refinement_program(meta_prompt=meta_prompt)
                        refined_json = getattr(response, 'refined_json', str(response))

                # Parse and return refined results
                return self._parse_llm_refinement_response(refined_json, detected_patterns)

            except (AttributeError, TypeError) as e:
                if "context" in str(e) or "OpenAI" in str(e) or "Predict" in str(e):
                    print(f"DSPy compatibility issue: {e}")
                    print("Falling back to rule-based detection only...")
                    # Return original patterns if DSPy operations fail
                    return detected_patterns
                else:
                    raise

        except Exception as e:
            print(f"LLM refinement failed: {e}")
            # Fall back to original patterns if LLM refinement fails
            return detected_patterns

    def _create_refinement_meta_prompt(self, original_prompt: str, detected_patterns: Dict[str, PatternMatch]) -> str:
        """Create a meta-prompt for LLM pattern refinement."""

        # List all available patterns
        available_patterns = list(self.patterns.keys())
        available_patterns_str = "\n".join(f"- {pattern}" for pattern in available_patterns)

        # Format detected patterns
        detected_str = ""
        for name, match in detected_patterns.items():
            detected_str += f"""
Pattern: {name}
Confidence: {match.confidence}
Description: {match.description}
Evidence: {', '.join(match.evidence[:2])}
Category: {match.category}
---
"""

        meta_prompt = f"""
You are an expert prompt engineering analyst. Review the following prompt and the patterns detected by an automated system.

**Original Prompt:**
{original_prompt}

**Automatically Detected Patterns:**
{detected_str}

**Available Pattern Types:**
{available_patterns_str}

**Your Task:**
Review the original prompt and the detected patterns. Then:

1. **Correct any mistakes** in the automated detection
2. **Add any missing patterns** from the available list that should be detected
3. **Remove patterns** that don't actually apply
4. **Adjust confidence scores** (0.0-1.0) based on how well each pattern fits
5. **Add evidence** for each pattern you include

**Response Format:**
Return a JSON object in this exact format:
{{
    "patterns": {{
        "pattern_name": {{
            "confidence": 0.8,
            "evidence": ["evidence 1", "evidence 2"],
            "description": "pattern description",
            "category": "pattern category"
        }}
    }}
}}

**Guidelines:**
- Only include patterns that are actually present in the prompt
- Focus on the most relevant and confident patterns (aim for 3-8 patterns max)
- Provide specific evidence from the prompt text
- Be conservative with high confidence scores (0.8+ only for very clear matches)
- Consider pattern interactions and hierarchies

**Important:** Respond ONLY with the JSON object, no other text.
"""

        return meta_prompt

    def _parse_llm_refinement_response(self, llm_response: str, fallback_patterns: Dict[str, PatternMatch]) -> Dict[str, PatternMatch]:
        """Parse the LLM's JSON response and create PatternMatch objects."""
        try:
            # Clean the response (remove markdown formatting if present)
            cleaned_response = llm_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()

            # Parse JSON
            parsed = json.loads(cleaned_response)

            # Convert to PatternMatch objects
            refined_patterns = {}
            for pattern_name, pattern_data in parsed.get("patterns", {}).items():
                if pattern_name in self.patterns:  # Only include known patterns
                    refined_patterns[pattern_name] = PatternMatch(
                        pattern=pattern_name,
                        confidence=float(pattern_data.get("confidence", 0.0)),
                        evidence=pattern_data.get("evidence", []),
                        description=pattern_data.get("description", self.patterns[pattern_name]["description"]),
                        category=pattern_data.get("category", self.patterns[pattern_name]["category"])
                    )

            return refined_patterns if refined_patterns else fallback_patterns

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Failed to parse LLM response: {e}")
            return fallback_patterns


# Example usage
if __name__ == "__main__":
    detector = AdvancedPromptPatternDetector()
    
    # Test prompts
    prompt1 = """You are a Twitter expert assigned to craft outstanding tweets.
    Generate the most engaging and impactful tweet possible based on the user's request.
    If the user provides feedback, refine and enhance your previous attempts accordingly 
    for maximum engagement."""
    
    prompt2 = """You are a Twitter influencer known for your engaging content and sharp insights.
    Review and critique the user's tweet. Provide constructive feedback, focusing on enhancing 
    its depth, style, and overall impact. Offer specific suggestions to make the tweet more 
    compelling and engaging for their audience."""
    
    prompt3 = """Let's solve this step by step:
    1. First, understand what the user is asking
    2. Then, think about the best approach
    3. Finally, provide a clear answer
    
    Given the context from the documents, answer the question."""
    
    print(detector.analyze_prompt(prompt1))
    print("\n" + "="*60 + "\n")
    print(detector.analyze_prompt(prompt2))
    print("\n" + "="*60 + "\n")
    print(detector.analyze_prompt(prompt3))
    
    # Get template example
    print("\n" + "="*60)
    print("TEMPLATE EXAMPLE: Chain of Thought")
    print("="*60)
    print(detector.get_template('chain_of_thought'))