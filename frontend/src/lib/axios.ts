import axios, { AxiosError } from 'axios';

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          // Token 过期或无效，清除本地存储并跳转登录
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('没有权限访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error('请求错误:', error.response.data);
      }
    } else if (error.request) {
      console.error('网络错误，请检查您的连接');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
