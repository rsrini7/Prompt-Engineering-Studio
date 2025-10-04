from langchain import hub
from ..models.analysis import PatternMatch
from typing import List, Dict

# This maps our internal pattern names to popular LangChain Hub prompts.
# We can expand this list over time.
PATTERN_TO_HUB_MAP = {
    "rag": ["rlm/rag-prompt", "langchain-ai/retrieval-qa-chat"],
    "react": ["hwchase17/react-chat", "hwchase17/react-json"],
    "chain_of_thought": ["rlm/rag-prompt-cot"],
    "role_prompting": ["hwchase17/react-chat", "rlm/rag-prompt"],
}

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