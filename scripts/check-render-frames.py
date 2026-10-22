"""Reject blank capture flashes before encoding; rails remain visible every frame."""
import json
import argparse
from pathlib import Path
import cv2
import importlib.util
spec=importlib.util.spec_from_file_location("frame_integrity",Path(__file__).with_name("frame-integrity.py"))
integrity=importlib.util.module_from_spec(spec);spec.loader.exec_module(integrity)

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--geometry')
parser.add_argument('--source-page')
parser.add_argument('--reference-frames', help='Previously verified lossless captures for encoded-video checks')
parser.add_argument('--background', default='#000000')
parser.add_argument('--video', action='store_true')
parser.add_argument('--video-path', default='exports/figma-showcase.mp4')
parser.add_argument('--frames-dir', default='working/render-frames')
parser.add_argument('--width', type=int)
parser.add_argument('--height', type=int)
parser.add_argument('--report')
args = parser.parse_args()
width = args.width or (1114 if args.video else 2228)
height = args.height or (836 if args.video else 1672)
if len(args.background)!=7 or args.background[0]!='#' or any(c not in '0123456789abcdefABCDEF' for c in args.background[1:]):
    raise ValueError('Background must be #RRGGBB')
bg = tuple(int(args.background[i:i+2],16) for i in (5,3,1))
lower = tuple(max(0,c-30) for c in bg)
upper = tuple(min(255,c+30) for c in bg)
expected=json.loads((root/args.geometry).read_text()) if args.geometry else None
source_page = cv2.imread(args.source_page) if args.source_page else None
if args.source_page and source_page is None:
    raise ValueError('Source page could not be decoded')
source_spec=importlib.util.spec_from_file_location('source_integrity',Path(__file__).with_name('source-integrity.py'))
source_integrity=importlib.util.module_from_spec(source_spec);source_spec.loader.exec_module(source_integrity)
bad = []
stats = []
video = cv2.VideoCapture(str(root / args.video_path)) if args.video else None
frame_count=len(expected) if expected else 722
for frame in range(frame_count):
    image = video.read()[1] if video is not None else cv2.imread(str(root / args.frames_dir / f'element-{frame:03d}.png'))
    if image is None or image.shape != (height, width, 3):
        bad.append({'frame': frame, 'reason': 'missing or wrong dimensions'})
        continue
    # A real empty beat still contains the three gray rails. A solid black or
    # white capture is never valid, even when all cards are outside the viewport.
    low, high = int(image.min()), int(image.max())
    bright = image.shape[0] * image.shape[1] - cv2.countNonZero(cv2.inRange(image, lower, upper))
    reason=integrity.inspect_frame(image,args.background,expected[frame] if expected else None)
    if reason == 'expected image content missing' and source_page is not None and expected is not None:
        if not source_integrity.source_expects_contrast(source_page, expected[frame], args.background, width, height):
            reason = None
    if reason == 'expected image content missing' and args.video and args.reference_frames and expected is not None:
        capture = cv2.imread(str(Path(args.reference_frames) / f'element-{frame:03d}.png'))
        if capture is not None and integrity.inspect_frame(capture, args.background, expected[frame]) is None:
            if source_integrity.matches_verified_capture(image, capture, expected[frame], args.background):
                reason = None
    if reason:
        bad.append({'frame': frame, 'reason': reason})
    if frame < 60 and bright < 10000 * width * height / (1114 * 836):
        bad.append({'frame': frame, 'reason': 'opening content missing'})
    stats.append({'frame': frame, 'contentPixels': bright, 'range': [low, high]})

if video is not None:
    if video.read()[0]:
        bad.append({'reason': 'unexpected additional video frames'})
    video.release()
report = {'background': args.background, 'framesChecked': len(stats), 'failures': bad, 'opening': stats[:60]}
name = args.report or ('video-frame-integrity.json' if video is not None else 'frame-integrity.json')
(root / 'working/evidence' / name).write_text(json.dumps(report, indent=2))
if bad:
    raise SystemExit(f'Render rejected: {bad}')
print(f'Frame integrity passed: all {frame_count} frames; no solid-color flashes or missing opening content.')
