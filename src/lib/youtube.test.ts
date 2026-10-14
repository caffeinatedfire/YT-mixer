import { describe, expect, it } from 'vitest';
import { isVideoId, parseYouTubeId, thumbnailUrl } from './youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeId', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}`],
    [`http://m.youtube.com/watch?v=${ID}`],
    [`www.youtube.com/watch?v=${ID}`],
    [`https://www.youtube.com/watch?v=${ID}&t=42s`],
    [`https://www.youtube.com/watch?v=${ID}&list=PL123&index=3`],
    [`https://www.youtube.com/watch?feature=share&v=${ID}`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=abc&t=10`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://youtube.com/shorts/${ID}?feature=share`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube-nocookie.com/embed/${ID}?start=5`],
    [`https://www.youtube.com/live/${ID}`],
    [`https://music.youtube.com/watch?v=${ID}&list=RDAMVM`],
    [ID],
    [`  ${ID}  `],
  ])('extracts the id from %s', (input) => {
    expect(parseYouTubeId(input)).toBe(ID);
  });

  it.each([
    [''],
    ['   '],
    ['hello world'],
    ['dQw4w9WgXc'], // 10 chars
    ['dQw4w9WgXcQQ'], // 12 chars
    ['dQw4w9WgX!Q'],
    ['https://vimeo.com/123456'],
    [`https://example.com/watch?v=${ID}`],
    ['https://www.youtube.com/watch?v=short'],
    ['https://www.youtube.com/'],
    ['https://www.youtube.com/playlist?list=PL123'],
    ['https://youtu.be/'],
  ])('returns null for %s', (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
});

describe('isVideoId', () => {
  it('accepts 11 chars of [A-Za-z0-9_-]', () => {
    expect(isVideoId('a-b_C123456')).toBe(true);
    expect(isVideoId('a-b_C12345')).toBe(false);
  });
});

describe('thumbnailUrl', () => {
  it('uses the mqdefault image', () => {
    expect(thumbnailUrl(ID)).toBe(`https://img.youtube.com/vi/${ID}/mqdefault.jpg`);
  });
});
