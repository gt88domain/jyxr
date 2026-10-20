#!/usr/bin/env python3
import argparse
from content_modules import build, selected_module

parser = argparse.ArgumentParser(description='Build one independent content module.')
parser.add_argument('--module')
args = parser.parse_args()
build(selected_module(args.module))
