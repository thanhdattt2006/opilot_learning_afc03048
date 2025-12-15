import type { Prisma } from '@prisma/client';
import { json } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';
import { Link, useLoaderData, useSubmit, useSearchParams, Form } from '@remix-run/react';
import { useEffect, useState } from 'react';

import { prisma } from '~/services/db.server';

const PAGE_SIZE = 8;

// Define the TypeScript type for the loader data
export type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    category: true;
    subCategory: true;
    tags: true;
  };
}>;

export type SerializedCourse = Omit<CourseWithRelations, 'postDate'> & {
  postDate: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const categoryId = url.searchParams.get('categoryId') || undefined;
  const subCategoryId = url.searchParams.get('subCategoryId') || undefined;
  const isFree = url.searchParams.get('isFree');
  const tagId = url.searchParams.get('tagId') || undefined;
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;
  const sort = url.searchParams.get('sort') || 'postDate-desc';
  
  // --- PAGINATION LOGIC FIX (MANUAL) ---
  let page = parseInt(url.searchParams.get('page') || '1', 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  // -------------------------------------

  const where: Prisma.CourseWhereInput = {
    title: search ? { contains: search } : undefined,
    categoryId: categoryId || undefined,
    subCategoryId: subCategoryId || undefined,
    isFree: isFree === 'yes' ? true : isFree === 'no' ? false : undefined,
    tags: tagId ? { some: { id: tagId } } : undefined,
    postDate: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined,
    },
  };

  const orderBy: Prisma.CourseOrderByWithRelationInput = (() => {
    switch (sort) {
      case 'title-asc': return { title: 'asc' };
      case 'title-desc': return { title: 'desc' };
      case 'postDate-asc': return { postDate: 'asc' };
      case 'postDate-desc': default: return { postDate: 'desc' };
    }
  })();

  const skip = (page - 1) * PAGE_SIZE;
  const take = PAGE_SIZE;

  const [totalItems, courses] = await prisma.$transaction([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        category: true,
        subCategory: true,
        tags: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const serializedCourses: SerializedCourse[] = courses.map((course) => ({
    ...course,
    postDate: course.postDate.toISOString(),
  }));

  return json({
    courses: serializedCourses,
    pagination: { page, totalPages, totalItems },
    allCategories: await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { subCategories: { orderBy: { name: 'asc' } } },
    }),
    allTags: await prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  });
};

export default function CoursesPage() {
  const { courses, pagination, allCategories, allTags } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);

  // Fix UX: Keep search input focused on reload
  useEffect(() => {
    const searchInput = document.getElementById('search') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = searchParams.get('search') || '';
    }
  }, [searchParams]);

  // Client-side Dependent Dropdown Logic
  const selectedCategoryId = searchParams.get('categoryId');
  const selectedCategory = allCategories.find((category) => category.id === selectedCategoryId);
  const filteredSubCategories = selectedCategory ? selectedCategory.subCategories : [];

  const createPageLink = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      
      {/* --- HEADER WITH CREATE BUTTON & COUNT --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            All Courses
            {/* Show Total Results Badge */}
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-indigo-600 bg-indigo-100 rounded-full ml-3">
              {pagination.totalItems}
            </span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your learning content.
          </p>
        </div>
        <Link
          to="/courses/new"
          className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create New Course
        </Link>
      </div>

      {/* --- FILTERS --- */}
      <form
        method="get"
        onChange={(e) => submit(e.currentTarget)}
        className="bg-white p-6 rounded-lg shadow-md mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <label htmlFor="search" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                name="search"
                id="search"
                defaultValue={searchParams.get('search') || ''}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Search courses..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
            <select
              name="categoryId"
              id="categoryId"
              key={searchParams.get('categoryId')}
              defaultValue={searchParams.get('categoryId') || ''}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All Categories</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subCategoryId" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">SubCategory</label>
            <select
              name="subCategoryId"
              id="subCategoryId"
              key={searchParams.get('subCategoryId')}
              defaultValue={searchParams.get('subCategoryId') || ''}
              disabled={!selectedCategoryId}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All SubCategories</option>
              {filteredSubCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>{subCategory.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="isFree" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
            <select
              name="isFree"
              id="isFree"
              key={searchParams.get('isFree')}
              defaultValue={searchParams.get('isFree') || ''}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="all">All</option>
              <option value="yes">Free</option>
              <option value="no">Paid</option>
            </select>
          </div>

          <div>
            <label htmlFor="tagId" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tag</label>
            <select
              name="tagId"
              id="tagId"
              key={searchParams.get('tagId')}
              defaultValue={searchParams.get('tagId') || ''}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sort By</label>
            <select
              name="sort"
              id="sort"
              key={searchParams.get('sort')}
              defaultValue={searchParams.get('sort') || 'postDate-desc'}
              className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-md px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="postDate-desc">Newest</option>
              <option value="postDate-asc">Oldest</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>
          </div>
        </div>
        <div className="mt-4 text-right">
          <Link to="/courses" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Clear Filters
          </Link>
        </div>
      </form>

      {/* --- COURSE LIST --- */}
      {courses.length === 0 ? (
        <p className="text-center text-gray-500">No matching courses found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-sm transform transition hover:-translate-y-1 hover:shadow-xl flex flex-col"
              >
                {/* --- DEMO IMAGE ADDED HERE --- */}
                <img 
                  src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2128&auto=format&fit=crop" 
                  alt="Course Thumbnail" 
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${course.isFree ? 'bg-green-500' : 'bg-blue-500'}`}>
                      {course.isFree ? 'Free' : 'Paid'}
                    </span>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2" title={course.title}>
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">
                      {course.category ? course.category.name : 'Uncategorized'}
                    </p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 mr-1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                    {new Date(course.postDate).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.tags.map((tag) => (
                      <span key={tag.id} className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  
                  {/* Push buttons to bottom */}
                  <div className="mt-auto flex justify-end space-x-2 pt-4 border-t border-gray-100">
                    <Link
                      to={`/courses/${course.id}/edit`}
                      className="text-indigo-600 text-sm hover:underline font-medium"
                      style= {{ paddingRight: '6px' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteCourseId(course.id)}
                      className="text-red-600 text-sm hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- PAGINATION --- */}
          <div className="mt-8 flex justify-center items-center space-x-2">
            <Link
              to={createPageLink(pagination.page - 1)}
              className={`px-4 py-2 border rounded-md ${
                pagination.page <= 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none opacity-50'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={(e) => { if (pagination.page <= 1) e.preventDefault(); }}
              aria-disabled={pagination.page <= 1}
            >
              Previous
            </Link>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <Link
                  key={pageNumber}
                  to={createPageLink(pageNumber)}
                  className={`px-4 py-2 border rounded-md ${
                    pageNumber === pagination.page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNumber}
                </Link>
              )
            )}

            <Link
              to={createPageLink(pagination.page + 1)}
              className={`px-4 py-2 border rounded-md ${
                pagination.page >= pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none opacity-50'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              onClick={(e) => { if (pagination.page >= pagination.totalPages) e.preventDefault(); }}
              aria-disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Link>
          </div>
        </>
      )}

      {/* --- DELETE MODAL --- */}
      {deleteCourseId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-10 max-w-xl mx-auto">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-red-500 mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856C18.978 19.5 20 18.485 20 17.25V6.75C20 5.515 18.978 4.5 17.644 4.5H6.356C5.022 4.5 4 5.515 4 6.75v10.5C4 18.485 5.022 19.5 6.356 19.5z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Delete Course</h2>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete <br/>
                <span className="font-bold text-gray-900">
                  "{courses.find((c) => c.id === deleteCourseId)?.title}"
                </span>? 
                <br/>This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setDeleteCourseId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <Form
                method="post"
                action={`/courses/${deleteCourseId}/destroy`}
                onSubmit={() => setDeleteCourseId(null)}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
