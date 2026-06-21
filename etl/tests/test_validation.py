import pytest

from homescope_etl.generate.generator import RegionRef
from homescope_etl.pipeline.errors import SchemaDriftError
from homescope_etl.pipeline.sources.broken import BrokenSource
from homescope_etl.pipeline.sources.synthetic import SyntheticSource
from homescope_etl.pipeline.validate import validate_record


def test_valid_records_pass():
    regions = [RegionRef("state:48", "state", "48", None, None)]
    for raw in SyntheticSource(regions, months=24).records():
        validate_record(raw, "synthetic")


def test_broken_record_raises_drift_naming_field():
    raw = next(iter(BrokenSource().records()))
    with pytest.raises(SchemaDriftError) as excinfo:
        validate_record(raw, "broken")
    assert excinfo.value.source == "broken"
    assert "metric" in excinfo.value.detail.lower()
