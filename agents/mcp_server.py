"""MCP server exposing SMT's *sanitized* brain as tools (Track 2 reuse).

This is the moat boundary in protocol form: the agents reach SMT only through these tools,
which return decisions / explanations / education context — never params, research, or PnL.
Run as a stdio MCP server consumed by the ADK agents.

    python -m agents.mcp_server

Tools:
  smt_world()              -> all-8-pairs decision snapshot
  smt_decision(pair)       -> one pair's decision + faithful why + risk score
  smt_education(level)     -> a ladder rung (smt|trading|crypto)
  smt_retrieve(query,level)-> RAG context from the AlloyDB education corpus
"""

from __future__ import annotations

from brain import adapter
from agents.educator_agent import rung


def _build_server():
    from mcp.server.fastmcp import FastMCP        # mcp

    server = FastMCP("smt-world")

    @server.tool()
    def smt_world() -> dict:
        """All 8 pairs' current decisions (sanitized)."""
        return adapter.world()

    @server.tool()
    def smt_decision(pair: str) -> dict:
        """One pair's decision: action, conviction, faithful 'why', risk score."""
        return adapter.decision(pair)

    @server.tool()
    def smt_education(level: str = "smt") -> str:
        """A curated education lesson for a ladder rung: smt | trading | crypto."""
        return rung(level)

    @server.tool()
    def smt_retrieve(query: str, level: str = "smt") -> str:
        """RAG context from the AlloyDB education corpus for a guest question."""
        try:
            from agents.rag.retrieve import retrieve
            return retrieve(query, level=level) or rung(level)
        except Exception:
            return rung(level)

    return server


if __name__ == "__main__":
    _build_server().run()
