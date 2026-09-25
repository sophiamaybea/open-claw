from pathlib import Path

from open_claw.tools.gencraft.cli import build_parser
from open_claw.tools.gencraft.config import GencraftConfig


def test_generate_url():
    cfg = GencraftConfig(base_url="https://gencraft.com/", generate_path="/generate")
    assert cfg.generate_url == "https://gencraft.com/generate"


def test_parser_generate_reference():
    parser = build_parser()
    args = parser.parse_args(["generate", "ink drawing of a city", "--mode", "image", "--reference", "ref.png", "--json"])
    assert args.prompt == "ink drawing of a city"
    assert args.reference == Path("ref.png")
    assert args.json is True


def test_config_save_load(tmp_path):
    path = tmp_path / "config.json"
    cfg = GencraftConfig(output_dir=str(tmp_path / "out"), headless=False)
    cfg.save(path)
    loaded = GencraftConfig.load(path)
    assert loaded.output_dir == str(tmp_path / "out")
    assert loaded.headless is False
