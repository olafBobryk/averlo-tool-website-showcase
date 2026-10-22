"""Use the literal source raster to distinguish dark entering edges from blank captures."""
import cv2
import numpy as np


def source_expects_contrast(page, expected, background, width, height):
    regions = expected.get('imageRegions')
    # Older geometry has no source mapping: retain the original strict check.
    if regions is None or any(p['group'] == 'clipped-page' and p['opacity'] >= .2 for p in expected['planes']):
        return True
    sx, sy = width / 1114, height / 836
    bg = tuple(int(background[i:i + 2], 16) for i in (5, 3, 1))
    mask = np.zeros((height, width), dtype=np.uint8)
    contrast = np.zeros_like(mask)
    for r in regions:
        if r['opacity'] < .2:
            continue
        c = r['clip']
        x0, x1 = max(0, int(np.ceil(c['x'] * sx))), min(width, int(np.floor((c['x'] + c['width']) * sx)))
        y0, y1 = max(0, int(np.ceil(c['y'] * sy))), min(height, int(np.floor((c['y'] + c['height']) * sy)))
        if x1 <= x0 or y1 <= y0:
            continue
        mask[y0:y1, x0:x1] = 255
        section = page[r['sourceY']:r['sourceY'] + r['sourceHeight'], :r['sourceWidth']]
        transform = np.array([[r['width'] / r['sourceWidth'] * sx, 0, r['x'] * sx - x0],
                              [0, r['height'] / r['sourceHeight'] * sy, r['y'] * sy - y0]], dtype=np.float64)
        pixels = cv2.warpAffine(section, transform, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderValue=bg)
        pixels = np.clip(pixels.astype(np.float32) * r['opacity'] + np.array(bg) * (1 - r['opacity']), 0, 255).astype(np.uint8)
        different = cv2.bitwise_not(cv2.inRange(pixels, tuple(max(0, c - 30) for c in bg), tuple(min(255, c + 30) for c in bg)))
        contrast[y0:y1, x0:x1] |= different
    for x in expected['rails']:
        mask[:, max(0, int((x - 3) * sx)):min(width, int((x + 4) * sx))] = 0
    area = cv2.countNonZero(mask)
    return cv2.countNonZero(cv2.bitwise_and(contrast, mask)) >= max(100 * sx * sy, area * .002)


def matches_verified_capture(image, capture, expected, background):
    """Confirm sparse content survives H.264 quantization at the same pixels.

    Used only after the source capture passes image-presence verification. A
    global error average alone would incorrectly accept a blank sparse frame.
    Require agreement on the capture's contrasting artwork as well.
    """
    if capture is None or capture.shape != image.shape:
        return False
    height, width = image.shape[:2]
    sx, sy = width / 1114, height / 836
    bg = tuple(int(background[i:i + 2], 16) for i in (5, 3, 1))
    mask = np.zeros((height, width), dtype=np.uint8)
    for p in expected['planes']:
        if p['opacity'] < .2:
            continue
        x0, x1 = max(0, int(np.ceil(p['x'] * sx))), min(width, int(np.floor((p['x'] + p['width']) * sx)))
        y0, y1 = max(0, int(np.ceil(p['y'] * sy))), min(height, int(np.floor((p['y'] + p['height']) * sy)))
        if x1 > x0 and y1 > y0:
            mask[y0:y1, x0:x1] = 255
    for x in expected['rails']:
        mask[:, max(0, int((x - 3) * sx)):min(width, int((x + 4) * sx))] = 0
    contrast = cv2.bitwise_not(cv2.inRange(capture, tuple(max(0, c - 30) for c in bg), tuple(min(255, c + 30) for c in bg)))
    artwork = cv2.bitwise_and(contrast, mask) != 0
    if not np.any(artwork):
        return False
    difference = cv2.absdiff(image, capture)
    return float(difference.mean()) <= 3 and float(np.mean(np.max(difference, axis=2)[artwork] <= 12)) >= .99
