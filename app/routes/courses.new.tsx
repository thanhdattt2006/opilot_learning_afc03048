import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { prisma } from "~/services/db.server";
import { useState } from "react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import type { Prisma } from "@prisma/client";

type LoaderData = {
  allCategories: Array<{
    id: string;
    name: string;
    subCategories: { id: string; name: string }[];
  }>;
  allTags: { id: string; name: string }[];
};

export const loader: LoaderFunction = async () => {
  const allCategories = await prisma.category.findMany({
    include: { subCategories: true },
    orderBy: { name: "asc" },
  });

  const allTags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return json<LoaderData>({ allCategories, allTags });
};

type ActionData = {
  errors?: {
    title?: string;
    categoryId?: string;
    subCategoryId?: string;
    postDate?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const title = formData.get("title")?.toString();
  const categoryId = formData.get("categoryId")?.toString();
  const subCategoryId = formData.get("subCategoryId")?.toString();
  const postDate = formData.get("postDate")?.toString();
  const isFree = formData.get("isFree") === "true";
  const tagIds = formData.getAll("tags").map((tag) => tag.toString());

  const errors: ActionData["errors"] = {};
  if (!title) errors.title = "Title is required";
  if (!categoryId) errors.categoryId = "Category is required";
  if (!subCategoryId) errors.subCategoryId = "SubCategory is required";
  if (!postDate) errors.postDate = "Post Date is required";

  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ errors });
  }

  await prisma.course.create({
    data: {
      title,
      isFree,
      postDate: new Date(postDate),
      categoryId,
      subCategoryId,
      tags: {
        connect: tagIds.map((id) => ({ id })),
      },
    },
  });

  return redirect("/courses");
};

export default function CreateCourse() {
  const { allCategories, allTags } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // add new sorted tags
  const sortedTags = [...allTags].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h1>
        <Form method="post">
          <div className="mb-4">
            <label htmlFor="title" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {actionData?.errors?.title && (
              <p className="text-red-500 text-sm mt-1">{actionData.errors.title}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="categoryId" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {actionData?.errors?.categoryId && (
              <p className="text-red-500 text-sm mt-1">{actionData.errors.categoryId}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="subCategoryId" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              SubCategory
            </label>
            <select
              id="subCategoryId"
              name="subCategoryId"
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!selectedCategory}
            >
              <option value="">Select a subcategory</option>
              {allCategories
                .find((category) => category.id === selectedCategory)
                ?.subCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                  </option>
                ))}
            </select>
            {actionData?.errors?.subCategoryId && (
              <p className="text-red-500 text-sm mt-1">{actionData.errors.subCategoryId}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isFree"
                  value="true"
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2" style={{ color: 'gray', paddingRight: '13px' }}>Free</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isFree"
                  value="false"
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2" style={{color: 'gray', paddingRight: '13px'}}>Paid</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="postDate" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Post Date
            </label>
            <input
              type="date"
              id="postDate"
              name="postDate"
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-md px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {actionData?.errors?.postDate && (
              <p className="text-red-500 text-sm mt-1">{actionData.errors.postDate}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {sortedTags.map((tag) => (
                <label key={tag.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag.id}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span style={{ color: 'gray', paddingRight: '6px' }}>{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Course"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
