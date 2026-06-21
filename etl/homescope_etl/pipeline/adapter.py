"""Source adapter protocol.

Each source is self-contained and exposes a uniform `fetch()` returning a raw,
unvalidated payload (a plain dict). Adding a source means adding an adapter and
nothing else. Validation happens downstream so adapters can faithfully reproduce
drifted upstream shapes.
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

RawData = dict[str, Any]


@runtime_checkable
class SourceAdapter(Protocol):
    name: str

    def fetch(self) -> RawData: ...
