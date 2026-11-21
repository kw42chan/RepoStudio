# Standard manual test

Run this in the studio before finishing any change to loading a post, generating ideas, or writing the reel and carousels. Record each row as pass or fail against the pass condition. Do not treat a known gap as a pass.

This source-flow checklist supplements [[Projects/RepoStudio/docs/testing/regression-smoke|the regression smoke suite required after app changes]]. Keep its source-specific failures separate from the local carousel suite's results.

## Steps

For each source:

1. Paste the link into Post URL and click Load link. For the video transcript, skip the link and paste the text instead.
2. Read Copied Post Content.
3. If a real post is in the box, click Generate Repurpose Ideas.
4. Select an angle. Confirm the reel is not written yet. Press Generate selected angle, then select a second angle and press Generate selected angle again. Compare the first spoken line of each reel.

## Cases

| Source | Input | Pass when |
| --- | --- | --- |
| X | `https://x.com/jack/status/1833951636005552366` | The box contains `We reject: kings, presidents, and voting.` and the post stays in English. The key insight is a line from that post. The first hook quotes `We reject: kings, presidents, and voting.` The second angle's opening line is different. |
| LinkedIn | `https://www.linkedin.com/feed/update/urn:li:activity:7496582593438523392` | The box keeps more than the opening line, including `campaign brief checklist` and the following paragraph. The key insight is from that post. The first hook quotes the opening. The second angle's opening line is different. |
| Instagram | `https://www.instagram.com/p/C8QJv0sR0eY/` | Load link puts the post caption in the box. A login wall, an empty box, or the previous post left in place is a fail. |
| Threads | `https://www.threads.net/@mosseri` | Load link puts one thread post in the box. A follower count, a bio, or a login prompt is a fail. |
| Video transcript | Set the source to Transcript and paste: `[00:00:01] The offer was weak, so more ads could not save it.` and `[00:00:04] Rewriting the first line made the same budget convert.` Also try `https://www.youtube.com/watch?v=jNQXAC9IVRw` with Load link. | Ideas quote `The offer was weak, so more ads could not save it.` and do not include `[00:00:01]`. The key insight is `Rewriting the first line made the same budget convert.` The two angle openings differ. No reel beat still contains `[00:00:01]` or `[00:00:04]`. A YouTube link passes only when the box receives the spoken transcript. |

## Last run

20 November 2026. Reconfirmed after the OpenRouter settings enhancement; source-flow evidence is retained in [[Projects/RepoStudio/docs/testing/runs/2026-11-20T11-35-30-845Z-2549b07-28ae21/README|the completed regression run]]. X, LinkedIn and pasted transcripts passed loading/ideas/two-angle generation; Instagram, Threads and the YouTube link retained the failures below. No live provider was configured for this source-flow run. Automated browser execution followed the studio steps, including both angle selections and generation. Transcript was rerun with the Video Transcript source selected after fixing timestamp leakage. These checks describe local behavior; they do not certify live model-provider quality.

| Source | Load | Ideas | Two angles |
| --- | --- | --- | --- |
| X | Pass. Full quoted post appears in English. | Pass. Insight is the rough-consensus sentence and the first hook quotes the source. | Pass. Openings differ. |
| LinkedIn | Pass. The campaign brief checklist and following paragraph remain in the box. | Pass. Insight comes from the paragraph about a shared definition of the problem, audience, and win. | Pass. Openings differ. |
| Instagram | Fail. No post text was found; the interface asks for a pasted caption. | Not run. | Not run. |
| Threads | Fail. The profile URL returns follower counts and a bio, not a thread. | Not run. | Not run. |
| Video transcript | Pass for the pasted transcript with Video Transcript selected. YouTube Load link failed to return a response within the 45-second browser wait. | Pass. The spoken hook and key insight exclude timestamps. | Pass after the generation-input fix. Openings differ and no reel beat retains either timestamp. |

Instagram, Threads, and YouTube loading remain open gaps. Pasting source content and transcript text remains the supported fallback for these cases. The reusable check is `node scripts/check-source-flow.mjs`; an optional source name runs one row.
