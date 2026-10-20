#!/usr/bin/env python3
import argparse
from content_modules import restore, selected_module

parser = argparse.ArgumentParser(description='Restore locked module resources with SHA-256 verification.')
parser.add_argument('--module')
parser.add_argument('--from', dest='source', help='Optional local snapshot directory; all hashes are still checked.')
args = parser.parse_args()
restore(selected_module(args.module), args.source)
