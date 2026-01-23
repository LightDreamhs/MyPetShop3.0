import React, { useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 重置错误
    setError('');

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // 动态导入 API，避免循环依赖
      const { uploadApi } = await import('../../services/api');
      const response = await uploadApi.uploadImage(file);

      if (response.data.code === 200) {
        const url = response.data.data.url;
        setPreview(url);
        onChange(url);
      } else {
        setError(response.data.message || '上传失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      setError('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview('');
    onChange('');
    setError('');
  };

  // 当外部 value 变化时更新预览
  React.useEffect(() => {
    setPreview(value || '');
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      {preview ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 group">
          <img
            src={preview}
            alt="预览"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title="删除图片"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            id="image-upload"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className={`
              flex flex-col items-center justify-center gap-2
              w-32 h-32 rounded-lg border-2 border-dashed border-gray-300
              cursor-pointer hover:border-blue-500 hover:bg-blue-50
              transition-colors
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-xs text-gray-500 mt-1">上传中...</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload size={24} className="mx-auto text-gray-400" />
                <p className="text-xs text-gray-500 mt-1">点击上传</p>
              </div>
            )}
          </label>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {!preview && !error && (
        <p className="text-xs text-gray-500">支持 JPG、PNG，最大 5MB</p>
      )}
    </div>
  );
};
