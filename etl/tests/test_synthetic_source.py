from homescope_etl.generate.generator import RegionRef
from homescope_etl.pipeline.validate import validate_record
from homescope_etl.pipeline.sources.synthetic import SyntheticSource


def test_synthetic_records_validate():
    regions = [RegionRef("state:48", "state", "48", None, None)]
    records = list(SyntheticSource(regions, months=24, seed=1).records())
    assert len(records) > 0
    for raw in records:
        record = validate_record(raw, "synthetic")
        assert record.region_id == "state:48"
