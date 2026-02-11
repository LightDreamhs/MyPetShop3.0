/**
 * 错误处理工具函数
 */

/**
 * 处理 API 错误并返回友好的错误消息
 * @param error - 错误对象
 * @param defaultMessage - 默认错误消息
 * @returns 友好的错误消息
 */
export function getErrorMessage(error: unknown, defaultMessage: string = '操作失败，请重试'): string {
  if (!error) {
    return defaultMessage;
  }

  const errorObj = error as {
    response?: {
      data?: {
        message?: string;
        code?: number;
      };
      status?: number;
    };
    message?: string;
  };

  // 如果是响应错误，提取服务器返回的消息
  if (errorObj.response?.data?.message) {
    const serverMessage = errorObj.response.data.message;
    const code = errorObj.response.data.code;

    // 根据错误码或消息内容优化显示
    if (code === 2001 || serverMessage.includes('库存不足')) {
      return `⚠️ ${serverMessage}`;
    }

    if (code === 1002 || code === 1003 || errorObj.response.status === 401) {
      return '登录已过期，请重新登录';
    }

    if (errorObj.response.status === 403) {
      return '您没有权限执行此操作';
    }

    if (errorObj.response.status === 404) {
      return '请求的资源不存在';
    }

    if (errorObj.response.status === 500) {
      return '服务器内部错误，请稍后重试';
    }

    // 其他错误直接显示服务器消息
    return serverMessage;
  }

  // 如果是网络错误（无响应）
  if (errorObj.response === undefined) {
    return '网络连接失败，请检查您的网络';
  }

  // 如果是标准 Error 对象
  if (errorObj.message) {
    return errorObj.message;
  }

  return defaultMessage;
}

/**
 * 显示错误提示
 * @param error - 错误对象
 * @param defaultMessage - 默认错误消息
 */
export function showErrorAlert(error: unknown, defaultMessage: string = '操作失败，请重试'): void {
  alert(getErrorMessage(error, defaultMessage));
}
