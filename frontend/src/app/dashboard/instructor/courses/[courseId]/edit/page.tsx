"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { courseApi, chapterApi, Course, Chapter } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { uploadToCloudinary, uploadResourceToCloudinary } from "@/utils/cloudinary";
import { 
  PlusIcon, 
  TrashIcon,
  BookOpenIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowDownCircleIcon,
  PencilIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CourseFormData {
  title: string;
  description: string;
  image_url: string;
  uploadingImage: boolean;
}

interface ChapterFormData {
  id?: number;
  title: string;
  description: string;
  video_url: string;
  image: File | null;
  resource: File | null;
  image_url: string;
  resource_url: string;
  uploadingImage: boolean;
  uploadingResource: boolean;
  isEditing?: boolean;
}

// Sortable Chapter Component
function SortableChapter({ 
  chapter, 
  index, 
  onEdit, 
  onDelete, 
  onSave, 
  onCancel, 
  onChange,
  onImageChange,
  onResourceChange,
  getFileNameFromUrl 
}: {
  chapter: ChapterFormData;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onSave: (index: number) => void;
  onCancel: (index: number) => void;
  onChange: (index: number, field: keyof ChapterFormData, value: string | File | null) => void;
  onImageChange: (index: number, file: File | null) => void;
  onResourceChange: (index: number, file: File | null) => void;
  getFileNameFromUrl: (url: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id || `new-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border border-gray-200 rounded-xl p-6 bg-gray-50"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-semibold text-gray-900">
              Chapter {index + 1}
            </span>
            
            <div className="flex gap-2">
              {chapter.isEditing ? (
                <>
                  <button
                    onClick={() => onSave(index)}
                    disabled={!chapter.title.trim()}
                    className="flex items-center gap-1 bg-blue-600 text-white px-5 py-1 rounded text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <ArrowDownCircleIcon className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => onCancel(index)}
                    className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(index)}
                    className="flex items-center justify-center gap-1 border-2 border-dashed border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:border-blue-600 hover:text-blue-600 cursor-pointer transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(index)}
                    className="flex items-center justify-center gap-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Content area with drag handle on the right */}
          <div className="flex justify-between items-center">
            {chapter.isEditing ? (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chapter Title *
                    </label>
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => onChange(index, 'title', e.target.value)}
                      placeholder="Enter chapter title"
                      className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={(e) => onChange(index, 'video_url', e.target.value)}
                      placeholder="https://example.com/video"
                      className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={(e) => onChange(index, 'description', e.target.value)}
                      placeholder="Describe this chapter's content"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Chapter Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chapter Image
                      </label>
                      
                      {/* Image Preview */}
                      {chapter.image_url && !chapter.uploadingImage && (
                        <div className="mb-2 border border-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={chapter.image_url} 
                            alt="Chapter preview" 
                            className="w-full h-20 object-cover"
                          />
                        </div>
                      )}
                      
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            onChange(index, 'image', file);
                            if (file) onImageChange(index, file);
                          }}
                          className="hidden"
                          disabled={chapter.uploadingImage}
                        />
                        <div className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors ${
                          chapter.uploadingImage
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}>
                          {chapter.uploadingImage ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-yellow-700">Uploading</span>
                            </div>
                          ) : (
                            <>
                              <PhotoIcon className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600">
                                {chapter.image_url ? 'Change Image' : 'Image'}
                              </span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Chapter Resource */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resource (PDF/TXT)
                      </label>
                      
                      {/* Resource Preview */}
                      {chapter.resource_url && !chapter.uploadingResource && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-800 font-medium truncate">
                              {getFileNameFromUrl(chapter.resource_url)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            onChange(index, 'resource', file);
                            if (file) onResourceChange(index, file);
                          }}
                          className="hidden"
                          disabled={chapter.uploadingResource}
                        />
                        <div className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors ${
                          chapter.uploadingResource
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}>
                          {chapter.uploadingResource ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs text-yellow-700">Uploading</span>
                            </div>
                          ) : (
                            <>
                              <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600">
                                {chapter.resource_url ? 'Change Resource' : 'Resource'}
                              </span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Read-only view */
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{chapter.title}</h4>
                  {chapter.description && (
                    <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                  )}
                </div>
                
                {/* Image and Resource Previews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image Preview */}
                  {chapter.image_url && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 p-2 border-b border-gray-200">
                        <span className="text-xs font-medium text-gray-700 flex items-center">
                          <PhotoIcon className="w-3 h-3 mr-1" />
                          Chapter Image
                        </span>
                      </div>
                      <img 
                        src={chapter.image_url} 
                        alt="Chapter preview" 
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  {/* Resource Preview */}
                  {chapter.resource_url && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-50 p-2 border-b border-blue-200">
                        <span className="text-xs font-medium text-blue-700 flex items-center">
                          <DocumentTextIcon className="w-3 h-3 mr-1" />
                          Chapter Resource
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getFileNameFromUrl(chapter.resource_url)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Click to download
                            </p>
                          </div>
                        </div>
                        <a 
                          href={chapter.resource_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded text-center block transition-colors"
                        >
                          Download Resource
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Indicators */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  {chapter.video_url && (
                    <span className="flex items-center">
                      <VideoCameraIcon className="w-3 h-3 mr-1" />
                      Video available
                    </span>
                  )}
                  {chapter.image_url && (
                    <span className="flex items-center">
                      <PhotoIcon className="w-3 h-3 mr-1" />
                      Image available
                    </span>
                  )}
                  {chapter.resource_url && (
                    <span className="flex items-center">
                      <DocumentTextIcon className="w-3 h-3 mr-1" />
                      Resource available
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Drag Handle - Now on the right side, vertically centered */}
            <div className="flex items-center gap-2 ml-4">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title="Drag to reorder"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: "",
    description: "",
    image_url: "",
    uploadingImage: false,
  });

  const [chapters, setChapters] = useState<ChapterFormData[]>([]);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "danger"
  });

  // Add DnD state and sensors to the main component
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex(chapter => 
        chapter.id === active.id || `new-${chapters.findIndex(c => !c.id && c === chapter)}` === active.id
      );
      const newIndex = chapters.findIndex(chapter => 
        chapter.id === over.id || `new-${chapters.findIndex(c => !c.id && c === chapter)}` === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedChapters = arrayMove(chapters, oldIndex, newIndex);
        setChapters(reorderedChapters);
      }
    }
  };

  useEffect(() => {
    if (!courseId) {
      router.push("/dashboard/instructor/courses");
      return;
    }
    fetchCourseData();
  }, [courseId, router]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const courseResponse = await courseApi.getCourse(courseId);
      setCourse(courseResponse);
      
      setCourseData({
        title: courseResponse.title,
        description: courseResponse.description || "",
        image_url: courseResponse.image_url || "",
        uploadingImage: false,
      });

      // Load existing chapters
      if (courseResponse.chapters) {
        const existingChapters: ChapterFormData[] = courseResponse.chapters.map((chapter: Chapter) => ({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description || "",
          video_url: chapter.video_url || "",
          image: null,
          resource: null,
          image_url: chapter.image || "",
          resource_url: chapter.notes_pdf || "",
          uploadingImage: false,
          uploadingResource: false,
          isEditing: false,
        }));
        setChapters(existingChapters);
      }
    } catch (error: any) {
      console.error('Failed to load course:', error);
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: error.message || 'Failed to load course data',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCourseData(prev => ({ ...prev, [name]: value }));
  };

  const handleCourseImageUpload = async (file: File) => {
    setCourseData(prev => ({ ...prev, uploadingImage: true }));
    
    try {
      const result = await uploadToCloudinary(file, 'courses');
      
      if (result.success && result.url) {
        setCourseData(prev => ({ 
          ...prev, 
          image_url: result.url!,
          uploadingImage: false 
        }));
        addToast({
          type: 'success',
          title: 'Image Uploaded',
          message: 'Course image uploaded successfully!',
          duration: 3000,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to upload course image:', error);
      setCourseData(prev => ({ ...prev, uploadingImage: false }));
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload image',
        duration: 5000,
      });
    }
  };

  const handleCourseImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      await handleCourseImageUpload(file);
    }
  };

  // Chapter Management Functions
  const handleChapterImageUpload = async (index: number, file: File) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === index ? { ...chapter, uploadingImage: true } : chapter
    ));

    try {
      const result = await uploadToCloudinary(file, 'chapters');
      
      if (result.success && result.url) {
        setChapters(prev => prev.map((chapter, i) => 
          i === index ? { 
            ...chapter, 
            image_url: result.url!,
            uploadingImage: false 
          } : chapter
        ));
        addToast({
          type: 'success',
          title: 'Image Uploaded',
          message: 'Chapter image uploaded successfully!',
          duration: 3000,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to upload chapter image:', error);
      setChapters(prev => prev.map((chapter, i) => 
        i === index ? { ...chapter, uploadingImage: false } : chapter
      ));
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload chapter image',
        duration: 5000,
      });
    }
  };

  const handleChapterResourceUpload = async (index: number, file: File) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === index ? { ...chapter, uploadingResource: true } : chapter
    ));

    try {
      const result = await uploadResourceToCloudinary(file, 'resources');
      
      if (result.success && result.url) {
        setChapters(prev => prev.map((chapter, i) => 
          i === index ? { 
            ...chapter, 
            resource_url: result.url!,
            uploadingResource: false 
          } : chapter
        ));
        addToast({
          type: 'success',
          title: 'Resource Uploaded',
          message: 'Chapter resource uploaded successfully!',
          duration: 3000,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Failed to upload resource:', error);
      setChapters(prev => prev.map((chapter, i) => 
        i === index ? { ...chapter, uploadingResource: false } : chapter
      ));
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload resource',
        duration: 5000,
      });
    }
  };

  const handleChapterChange = (index: number, field: keyof ChapterFormData, value: string | File | null) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === index ? { ...chapter, [field]: value } : chapter
    ));
  };

  const handleChapterImageChange = async (index: number, file: File | null) => {
    if (file) {
      setChapters(prev => prev.map((chapter, i) => 
        i === index ? { ...chapter, image: file } : chapter
      ));
      await handleChapterImageUpload(index, file);
    }
  };

  const handleChapterResourceChange = async (index: number, file: File | null) => {
    if (file) {
      setChapters(prev => prev.map((chapter, i) => 
        i === index ? { ...chapter, resource: file } : chapter
      ));
      await handleChapterResourceUpload(index, file);
    }
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
        image_url: "",
        resource_url: "",
        uploadingImage: false,
        uploadingResource: false,
        isEditing: true,
      }
    ]);
  };

  const removeChapter = (index: number) => {
    const chapter = chapters[index];
    
    if (chapter.id) {
      // Existing chapter - show confirmation
      showConfirmation(
        "Delete Chapter",
        "Are you sure you want to delete this chapter? This action cannot be undone.",
        async () => {
          try {
            await chapterApi.deleteChapter(chapter.id!);
            setChapters(prev => prev.filter((_, i) => i !== index));
            addToast({
              type: 'success',
              title: 'Chapter Deleted',
              message: 'Chapter deleted successfully!',
              duration: 5000,
            });
          } catch (error: any) {
            console.error('Failed to delete chapter:', error);
            addToast({
              type: 'error',
              title: 'Delete Failed',
              message: error.message || 'Failed to delete chapter',
              duration: 5000,
            });
          }
        },
        "danger"
      );
    } else {
      // New chapter - just remove from state
      setChapters(prev => prev.filter((_, i) => i !== index));
    }
  };

  const toggleChapterEdit = (index: number) => {
    setChapters(prev => prev.map((chapter, i) => 
      i === index ? { ...chapter, isEditing: !chapter.isEditing } : chapter
    ));
  };

  const cancelChapterEdit = (index: number) => {
    const chapter = chapters[index];
    if (chapter.id) {
      // Reset to original values for existing chapter
      toggleChapterEdit(index);
    } else {
      // Remove new chapter
      removeChapter(index);
    }
  };

  const saveChapter = async (index: number) => {
    const chapter = chapters[index];
    
    if (!chapter.title.trim()) {
        addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Chapter title is required',
        duration: 4000,
        });
        return;
    }

    try {
        if (chapter.id) {
        // Update existing chapter - send all fields including image URL
        const updateData = {
            title: chapter.title,
            description: chapter.description,
            video_url: chapter.video_url,
            order: index,
            image: chapter.image_url, // Send the Cloudinary URL, not the File
        };
        
        await chapterApi.updateChapter(chapter.id, updateData);
        
        addToast({
            type: 'success',
            title: 'Chapter Updated',
            message: 'Chapter updated successfully!',
            duration: 5000,
        });
        } else {
        // Create new chapter - use the create endpoint which accepts URLs
        const chapterData = {
            title: chapter.title,
            description: chapter.description,
            video_url: chapter.video_url,
            image: chapter.image_url, // Cloudinary URL
            resource_url: chapter.resource_url, // Cloudinary URL
            order: index,
        };

        await chapterApi.createChapter(parseInt(courseId), chapterData);
        addToast({
            type: 'success',
            title: 'Chapter Added',
            message: 'Chapter added successfully!',
            duration: 5000,
        });
        }

        // Refresh course data
        await fetchCourseData();

    } catch (error: any) {
        console.error('Failed to save chapter:', error);
        addToast({
        type: 'error',
        title: 'Save Failed',
        message: error.message || 'Failed to save chapter',
        duration: 5000,
        });
    }
  };

  const handleSaveCourse = async () => {
    try {
      setSaving(true);

      // Update course description
      await courseApi.updateCourse(parseInt(courseId), {
        description: courseData.description,
      });

      addToast({
        type: 'success',
        title: 'Course Updated',
        message: 'Course updated successfully!',
        duration: 5000,
      });

      router.push(`/dashboard/instructor/courses/${courseId}`);

    } catch (error: any) {
      console.error('Failed to update course:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update course',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const showConfirmation = (title: string, message: string, onConfirm: () => void, variant: "danger" | "warning" | "info" = "danger") => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'resource';
      return decodeURIComponent(fileName);
    } catch {
      const parts = url.split('/');
      const lastPart = parts.pop() || 'resource';
      return decodeURIComponent(lastPart.split('?')[0]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/instructor/courses')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Edit Course
              </h1>
              <p className="text-gray-600">
                Update your course details and manage chapters
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/instructor/courses/${courseId}`)}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </motion.div>

        <div className="space-y-8">
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
              {/* Course Title - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseData.title}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Course title cannot be changed once created
                </p>
              </div>

              {/* Course Description */}
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
                  className="w-full px-4 py-3 border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Course Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Image
                </label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {courseData.image_url && !courseData.uploadingImage && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-w-xs">
                      <img 
                        src={courseData.image_url} 
                        alt="Course preview" 
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCourseImageChange}
                      className="hidden"
                      disabled={courseData.uploadingImage}
                    />
                    <div className={`flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                      courseData.uploadingImage 
                        ? 'border-yellow-400 bg-yellow-50' 
                        : 'border-gray-300 hover:border-blue-500'
                    }`}>
                      {courseData.uploadingImage ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-yellow-700">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <PhotoIcon className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-gray-600">
                            {courseData.image_url ? 'Change course image' : 'Choose course image'}
                          </span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chapters Section with DnD context */}
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

            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={chapters.map(chapter => chapter.id || `new-${chapters.indexOf(chapter)}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence>
                    {chapters.map((chapter, index) => (
                      <SortableChapter
                        key={chapter.id || `new-${index}`}
                        chapter={chapter}
                        index={index}
                        onEdit={toggleChapterEdit}
                        onDelete={removeChapter}
                        onSave={saveChapter}
                        onCancel={cancelChapterEdit}
                        onChange={handleChapterChange}
                        onImageChange={handleChapterImageChange}
                        onResourceChange={handleChapterResourceChange}
                        getFileNameFromUrl={getFileNameFromUrl}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>

              {chapters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <VideoCameraIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No chapters yet. Add your first chapter to get started!</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Save Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Save Changes</h3>
                <p className="text-gray-600 text-sm">
                  Review your changes before saving
                </p>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/instructor/courses/${courseId}`)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Discard
                </button>
                
                <motion.button
                  onClick={handleSaveCourse}
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.05 }}
                  whileTap={{ scale: saving ? 1 : 0.95 }}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && confirmationModal.title && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          variant={confirmationModal.variant}
        />
      )}
    </div>
  );
}