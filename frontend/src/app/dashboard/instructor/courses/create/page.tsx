"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { courseApi, chapterApi } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { 
  PlusIcon, 
  TrashIcon,
  BookOpenIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";

interface ChapterFormData {
  title: string;
  description: string;
  video_url: string;
  image?: File | null;
  resource?: File | null;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    image: null as File | null,
  });
  
  const [chapters, setChapters] = useState<ChapterFormData[]>([
    {
      title: "",
      description: "",
      video_url: "",
      image: null,
      resource: null,
    }
  ]);

  const handleCourseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleCourseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCourseData(prev => ({ ...prev, image: file }));
  };

  const handleChapterChange = (index: number, field: keyof ChapterFormData, value: string | File | null) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === index ? { ...chapter, [field]: value } : chapter
    ));
  };

  const addChapter = () => {
    setChapters(prev => [
      ...prev,
      {
        title: "",
        description: "",
        video_url: "",
        image: null,
        resource: null,
      }
    ]);
  };

  const removeChapter = (index: number) => {
    if (chapters.length > 1) {
      setChapters(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): boolean => {
    if (!courseData.title.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Course title is required',
        duration: 4000,
      });
      return false;
    }

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      if (!chapter.title.trim()) {
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: `Chapter ${i + 1} title is required`,
          duration: 4000,
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Step 1: Create the course
      const formData = new FormData();
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      if (courseData.image) {
        formData.append('image', courseData.image);
      }

      const courseResponse = await courseApi.createCourse(
        courseData.title,
        courseData.description,
        courseData.image || undefined
      );

      const courseId = courseResponse.id;

      // Step 2: Create chapters
      const chapterPromises = chapters.map(async (chapter, index) => {
        const chapterFormData = new FormData();
        chapterFormData.append('title', chapter.title);
        chapterFormData.append('description', chapter.description);
        chapterFormData.append('video_url', chapter.video_url);
        chapterFormData.append('order', index.toString());
        
        if (chapter.image) {
          chapterFormData.append('image', chapter.image);
        }

        // Create chapter
        const chapterResponse = await chapterApi.createChapter(courseId, {
          title: chapter.title,
          description: chapter.description,
          video_url: chapter.video_url,
          order: index,
          image: chapter.image || undefined,
        });

        // Upload resource if provided
        if (chapter.resource) {
          await chapterApi.uploadResource(chapterResponse.id, chapter.resource);
        }

        return chapterResponse;
      });

      await Promise.all(chapterPromises);

      addToast({
        type: 'success',
        title: 'Course Created',
        message: 'Course and chapters created successfully!',
        duration: 5000,
      });

      // Redirect to instructor courses page
      router.push('/dashboard/instructor/courses');

    } catch (error: any) {
      console.error('Failed to create course:', error);
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: error.message || 'Failed to create course. Please try again.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Course
          </h1>
          <p className="text-gray-600">
            Build your course by adding details and creating chapters for your content.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Course Details Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BookOpenIcon className="w-6 h-6 mr-2 text-blue-600" />
              Course Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={courseData.title}
                  onChange={handleCourseInputChange}
                  placeholder="Enter course title"
                  className="w-full px-4 py-3 border text-gray-500 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description
                </label>
                <textarea
                  name="description"
                  value={courseData.description}
                  onChange={handleCourseInputChange}
                  placeholder="Describe what students will learn in this course"
                  rows={4}
                  className="w-full px-4 py-3 border text-gray-500 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Image
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCourseImageChange}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                      <PhotoIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        {courseData.image ? courseData.image.name : 'Choose course image'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chapters Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <VideoCameraIcon className="w-6 h-6 mr-2 text-green-600" />
                Course Chapters ({chapters.length})
              </h2>
              <motion.button
                type="button"
                onClick={addChapter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 cursor-pointer transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Chapter
              </motion.button>
            </div>

            <div className="space-y-6">
              {chapters.map((chapter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="border border-gray-200 rounded-xl p-6 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chapter {index + 1}
                    </h3>
                    {chapters.length > 1 && (
                      <motion.button
                        type="button"
                        onClick={() => removeChapter(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chapter Title *
                        </label>
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                          placeholder="Enter chapter title"
                          className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video URL
                        </label>
                        <input
                          type="url"
                          value={chapter.video_url}
                          onChange={(e) => handleChapterChange(index, 'video_url', e.target.value)}
                          placeholder="https://example.com/video"
                          className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chapter Description
                        </label>
                        <textarea
                          value={chapter.description}
                          onChange={(e) => handleChapterChange(index, 'description', e.target.value)}
                          placeholder="Describe this chapter's content"
                          rows={3}
                          className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chapter Image
                          </label>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleChapterChange(index, 'image', e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <div className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                              <PhotoIcon className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600">Image</span>
                            </div>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resource (PDF/TXT)
                          </label>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.txt"
                              onChange={(e) => handleChapterChange(index, 'resource', e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <div className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                              <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600">Resource</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File previews */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {chapter.image && (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        <PhotoIcon className="w-3 h-3 mr-1" />
                        {chapter.image.name}
                      </span>
                    )}
                    {chapter.resource && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        <DocumentTextIcon className="w-3 h-3 mr-1" />
                        {chapter.resource.name}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add Chapter Button at bottom */}
            <div className="mt-6 flex justify-center">
              <motion.button
                type="button"
                onClick={addChapter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 border-2 border-blue-600 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Another Chapter
              </motion.button>
            </div>
          </motion.div>

          {/* Submit Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Create</h3>
                <p className="text-gray-600 text-sm">
                  Review your course details and chapters before creating
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.05 }}
                  whileTap={{ scale: loading ? 1 : 0.95 }}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Course...
                    </div>
                  ) : (
                    'Create Course'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}