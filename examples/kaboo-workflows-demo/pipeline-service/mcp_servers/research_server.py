from __future__ import annotations

import asyncio
import random

from mcp.server.fastmcp import Context, FastMCP

from kaboo_workflows.mcp import MCPServer

MOCK_RESULTS = {
    "gpu": [
        {"title": "NVIDIA H200 Availability Expands Across Major Clouds", "source": "TechCrunch", "date": "2025-01-15", "snippet": "GPU cloud providers race to offer H200 instances as training demand surges 40% YoY."},
        {"title": "Cloud GPU Market to Reach $85B by 2028", "source": "Gartner", "date": "2025-02-01", "snippet": "Enterprise AI adoption drives explosive growth in GPU-as-a-service market."},
        {"title": "Spot GPU Pricing Drops 30% as New Entrants Join Market", "source": "The Information", "date": "2025-01-28", "snippet": "Increased competition from smaller providers pushes down spot instance pricing across all GPU tiers."},
    ],
    "llm": [
        {"title": "Enterprise LLM API Spending Doubles in Q4 2024", "source": "Goldman Sachs Research", "date": "2025-01-10", "snippet": "Fortune 500 companies now spend an average of $2.3M annually on LLM API services."},
        {"title": "Fine-Tuning Platforms See 3x Growth", "source": "a16z", "date": "2025-01-20", "snippet": "Custom model fine-tuning emerges as the fastest-growing segment in the LLM API market."},
        {"title": "Open-Source Models Close Gap with Proprietary APIs", "source": "Arxiv Weekly", "date": "2025-02-05", "snippet": "Llama 4 and Mistral Large benchmarks within 5% of leading proprietary models on enterprise tasks."},
    ],
    "vector": [
        {"title": "Vector Database Market Hits $3.2B, Growing 85% YoY", "source": "IDC", "date": "2025-01-25", "snippet": "RAG adoption in enterprise drives unprecedented growth in vector database segment."},
        {"title": "Hybrid Search Becomes Table Stakes for Vector DBs", "source": "InfoWorld", "date": "2025-02-03", "snippet": "Leading vector databases add sparse-dense hybrid search as standard feature amid competitive pressure."},
    ],
    "pricing": [
        {"title": "Cloud AI Services Pricing War Intensifies", "source": "Bloomberg", "date": "2025-01-30", "snippet": "Major providers cut inference pricing by 40-60% in Q1 2025, pressuring smaller competitors."},
        {"title": "Usage-Based Pricing Dominates AI SaaS", "source": "Bessemer Cloud Index", "date": "2025-02-02", "snippet": "78% of AI infrastructure companies now offer consumption-based pricing models."},
    ],
    "default": [
        {"title": "AI Infrastructure Investment Reaches Record $120B in 2024", "source": "PitchBook", "date": "2025-01-18", "snippet": "VC and corporate investment in AI infrastructure companies surged to all-time highs."},
        {"title": "Enterprise AI Adoption Report 2025", "source": "McKinsey", "date": "2025-02-01", "snippet": "72% of enterprises now use AI in at least one business function, up from 55% in 2023."},
        {"title": "Emerging AI Startups to Watch in 2025", "source": "CB Insights", "date": "2025-01-22", "snippet": "50 fastest-growing AI startups span GPU cloud, vector databases, MLOps, and AI analytics."},
    ],
}


def _match_results(query: str) -> list[dict]:
    q = query.lower()
    for keyword, results in MOCK_RESULTS.items():
        if keyword in q:
            return results
    return MOCK_RESULTS["default"]


class ResearchServer(MCPServer):

    def _register_tools(self, mcp: FastMCP) -> None:
        @mcp.tool()
        async def search_web(query: str, ctx: Context) -> str:
            """Search the web for market research, industry news, and analyst reports.

            Args:
                query: The search query (e.g., "cloud GPU market trends 2025").

            Returns:
                Formatted search results with titles, sources, dates, and snippets.
            """
            results = _match_results(query)
            selected = random.sample(results, min(len(results), 3))

            output = []
            for i, r in enumerate(selected):
                await ctx.info(f"Fetching result {i + 1}: {r['title']}")
                await ctx.report_progress(i + 1, len(selected))
                await asyncio.sleep(0.3)
                output.append(
                    f"**{r['title']}**\n"
                    f"Source: {r['source']} | Date: {r['date']}\n"
                    f"{r['snippet']}\n"
                )

            return "\n---\n".join(output) if output else "No results found for the query."

        @mcp.tool()
        async def fetch_pricing(segment: str, ctx: Context) -> str:
            """Fetch current vendor pricing signals for a market segment.

            Args:
                segment: The market segment (e.g. "cloud gpu", "llm api").

            Returns:
                A short pricing snapshot for the segment.
            """
            await ctx.info(f"Looking up pricing signals for {segment}...")
            await asyncio.sleep(0.4)
            results = _match_results("pricing")
            lines = [f"- {r['title']} ({r['source']}, {r['date']})" for r in results]
            return f"Pricing signals for '{segment}':\n" + "\n".join(lines)

        @mcp.tool()
        async def fetch_report(report_id: str, ctx: Context) -> str:
            """Fetch a full analyst report by its id from the reports backend.

            Args:
                report_id: The id of the report to fetch.

            Returns:
                The report text. (This backend is currently unavailable and will
                raise — used to exercise tool-failure handling.)
            """
            await ctx.info(f"Contacting reports backend for {report_id}...")
            await asyncio.sleep(0.3)
            raise RuntimeError(
                "reports-backend unreachable: upstream returned 503 Service Unavailable"
            )


def create(name: str = "research", port: int = 9002) -> ResearchServer:
    return ResearchServer(name=name, port=port)
