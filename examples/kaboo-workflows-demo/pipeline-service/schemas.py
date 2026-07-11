"""Pydantic output schemas for structured-output demo pipelines.

Referenced from YAML via ``output_schema: ./schemas.py:MarketReport``. Kaboo loads
the class and passes it to the agent as ``structured_output_model`` so the agent
emits a validated object, which the UI renders as a structured card.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class MarketReport(BaseModel):
    """A concise, structured market-research report."""

    segment: str = Field(description="The market segment analysed, e.g. 'Cloud GPUs'.")
    key_findings: list[str] = Field(description="Three to five concise key findings.")
    top_players: list[str] = Field(description="Leading companies or products in the segment.")
    outlook: str = Field(description="A short forward-looking outlook (1-2 sentences).")
