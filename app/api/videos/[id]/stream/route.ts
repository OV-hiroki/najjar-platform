import { NextRequest }          from "next/server";
import { prisma }               from "@/lib/prisma";
import { requireAuth, signVideoUrl, verifyVideoToken } from "@/lib/security";
import { apiOk, apiError }      from "@/lib/utils";

/**
 * GET /api/videos/[id]/stream
 *
 * Returns a signed, time-limited token for video playback.
 *
 * SECURITY:
 * 1. Must be authenticated
 * 2. Must have ACTIVE subscription to the course (unless video.isFree)
 * 3. Token is HMAC-signed, expires in 2 hours
 * 4. Raw video URL never exposed directly
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, res } = await requireAuth();
  if (res) return res;
  const userId  = session!.user.id;
  const videoId = params.id;

  if (!videoId || !/^[a-z0-9]+$/i.test(videoId)) {
    return apiError("معرف الفيديو غير صالح", 400);
  }

  const video = await prisma.video.findUnique({
    where:  { id: videoId },
    select: { id: true, courseId: true, isFree: true, title: true },
  });
  if (!video) return apiError("الفيديو غير موجود", 404);

  // Subscription gate
  if (!video.isFree) {
    const sub = await prisma.courseSubscription.findUnique({
      where:  { userId_courseId: { userId, courseId: video.courseId } },
      select: { status: true },
    });
    if (!sub || sub.status !== "ACTIVE") {
      return apiError("يجب الاشتراك في هذا الكورس لمشاهدة الفيديو", 403);
    }
  }

  const token = signVideoUrl(videoId, userId, 7200);  // 2-hour token

  return apiOk({ token, title: video.title, expiresIn: 7200 });
}

/**
 * POST /api/videos/[id]/stream
 * Verify token → return actual playback URL
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, res } = await requireAuth();
  if (res) return res;

  const body = await req.json().catch(() => ({}));
  const { token } = body as { token?: string };
  if (!token) return apiError("Token مطلوب", 400);

  const payload = verifyVideoToken(token);
  if (!payload)                             return apiError("Token منتهي أو غير صالح", 401);
  if (payload.userId  !== session!.user.id) return apiError("Token غير صالح لهذا المستخدم", 403);
  if (payload.videoId !== params.id)        return apiError("Token غير مطابق للفيديو", 403);

  const video = await prisma.video.findUnique({
    where:  { id: params.id },
    select: { url: true },
  });
  if (!video) return apiError("الفيديو غير موجود", 404);

  return apiOk({ playbackUrl: video.url });
}
