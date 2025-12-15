import { redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';

import { prisma } from '~/services/db.server';

export const action: ActionFunction = async ({ params }) => {
  const { courseId } = params;

  await prisma.course.delete({
    where: { id: courseId },
  });

  return redirect('/courses');
};
