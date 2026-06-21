"""Source adapter protocol.

Each source is self-contained and streams raw, unvalidated records (plain dicts)
via `records()`. Streaming keeps memory bounded regardless of dataset size.
Adding a source means adding an adapter and nothing else.
"""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any, Protocol, runtime_checkable

RawData = dict[str, Any]


@runtime_checkable
class SourceAdapter(Protocol):
    name: str

    def records(self) -> Iterable[RawData]: ...
