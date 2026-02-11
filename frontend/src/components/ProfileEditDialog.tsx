import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { ImageUpload } from './ui/ImageUpload';
import { Button } from './ui/Button';
import { userApi } from '../services/api';
import type { User, ProfileFormData, UserFormData } from '../types';

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    avatar: user?.avatar || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 当对话框打开或 user 变化时，重置表单数据
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        nickname: user.nickname || '',
        avatar: user.avatar || '',
      });
      setError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证昵称
    if (!formData.nickname.trim()) {
      setError('昵称不能为空');
      return;
    }

    if (formData.nickname.trim().length < 1) {
      setError('昵称长度至少为 1 个字符');
      return;
    }

    if (formData.nickname.trim().length > 20) {
      setError('昵称长度不能超过 20 个字符');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const updateData: ProfileFormData = {
        nickname: formData.nickname.trim(),
        avatar: formData.avatar,
      };
      await userApi.updateUser(user.id, updateData as UserFormData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('更新个人信息失败:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '更新失败，请重试';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      nickname: e.target.value,
    }));
    // 清除错误提示
    if (error) {
      setError('');
    }
  };

  const handleAvatarChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      avatar: url,
    }));
    // 清除错误提示
    if (error) {
      setError('');
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="编辑个人资料" size="sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 头像上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            头像
          </label>
          <ImageUpload
            value={formData.avatar}
            onChange={handleAvatarChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            支持 JPG、PNG 格式，最大 5MB
          </p>
        </div>

        {/* 昵称输入 */}
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
            昵称 <span className="text-red-500">*</span>
          </label>
          <Input
            id="nickname"
            type="text"
            value={formData.nickname}
            onChange={handleNicknameChange}
            placeholder="请输入昵称"
            maxLength={20}
            disabled={isLoading}
            className={error ? 'border-red-500' : ''}
          />
          <p className="text-xs text-gray-500 mt-1">
            长度限制：1-20 个字符
          </p>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>提示：</strong>您只能修改头像和昵称，用户名和角色由管理员管理。
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                更新中...
              </>
            ) : (
              '确认更新'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
