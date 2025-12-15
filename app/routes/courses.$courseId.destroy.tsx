import { redirect } from "@remix-run/node";
import { prisma } from "~/services/db.server";
import type { ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ params }) => {
  const { courseId } = params;

  await prisma.course.delete({
    where: { id: courseId },
  });

  return redirect("/courses");
};
