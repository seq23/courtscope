import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="CourtScope statistical engine placeholder")
    parser.add_argument("--version", action="store_true")
    args = parser.parse_args()
    if args.version:
        print("courtscope-model 0.1.0-structural")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
