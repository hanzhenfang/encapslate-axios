import axios from 'axios'
import { nanoid } from 'nanoid'
import axiosRetry from 'axios-retry'

import type { AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import type { AxiosError } from 'axios'

const REQUEST_ID_HEADER_KEY = 'X-Request-Id'

interface RequestOption {
  onBeforeRequest: (
    config: InternalAxiosRequestConfig
  ) => Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig
  isRequestSuccess(resp: AxiosResponse): boolean
  onRequestSuccess: () => any
  onRequestFaild: (resp: AxiosResponse) => any
  onResponseBack: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>
}

function createRequestOption(option?: Partial<RequestOption>) {
  const defaultOptions: RequestOption = {
    onBeforeRequest: async (config) => config,
    isRequestSuccess: (response) => true,
    onRequestSuccess: async () => {},
    onRequestFaild: async (response) => {},
    onResponseBack: async (response) => response,
  }
  return Object.assign(defaultOptions, option)
}

function createRequest(config: AxiosRequestConfig, options?: Partial<RequestOption>) {
  const instance = axios.create(config)
  axiosRetry(instance, {
    retries: 3,
    retryDelay: () => 2000,
  })
  const abortControllerMap = new Map<string, AbortController>() //创建一个 abortController 的 map
  let requestId: string = ''
  const { onBeforeRequest, isRequestSuccess, onRequestSuccess, onRequestFaild, onResponseBack } =
    createRequestOption(options)

  instance.interceptors.request.use((conf: InternalAxiosRequestConfig) => {
    const config: InternalAxiosRequestConfig = { ...conf } //1. 复制一份原有的 config 对象
    const aborter = new AbortController()
    requestId = nanoid()
    config.headers.set(REQUEST_ID_HEADER_KEY, requestId)

    if (!config.signal) {
      config.signal = aborter.signal
      abortControllerMap.set(requestId, aborter)
    }

    return onBeforeRequest(config)
  })

  instance.interceptors.response.use(async (resp: AxiosResponse) => {
    if (abortControllerMap.get(requestId)) {
      abortControllerMap.delete(requestId)
    }
    const isSuccess = isRequestSuccess(resp)
    if (isSuccess) {
      await onRequestSuccess()
    } else {
      await onRequestFaild(resp)
    }
    return onResponseBack(resp)
  })

  // 取消特定请求
  function cancelRequest(requestId: string) {
    const aborter = abortControllerMap.get(requestId)
    if (aborter) {
      aborter.abort()
      abortControllerMap.delete(requestId)
    }
  }

  // 取消所有请求
  function cancelAllRequest() {
    abortControllerMap.forEach((aborter) => aborter.abort())
  }

  return { instance, cancelRequest, cancelAllRequest }
}

type BaseResponse<T> = {
  code: number
  status: number
  message: string
  data: T
}

function createFlatRequest(config: AxiosRequestConfig, options?: Partial<RequestOption>) {
  const { instance, cancelRequest, cancelAllRequest } = createRequest(config, options)

  async function flatRequest<T = any>(config: AxiosRequestConfig) {
    try {
      const response: AxiosResponse = await instance(config)
      return {
        data: (response.data as BaseResponse<T>).data,
        error: null,
        response,
      }
    } catch (error) {
      return { data: null, error, response: (error as AxiosError).response }
    }
  }

  flatRequest.cancelRequest = cancelRequest
  flatRequest.cancelAllRequest = cancelAllRequest
  return flatRequest
}

const service = createFlatRequest(
  {
    baseURL: 'http://192.168.10.168:8765',
  },
  {
    onBeforeRequest: (config) => {
      const token = 'ceshi'
      if (!token) {
        const requestId = config.headers.get(REQUEST_ID_HEADER_KEY)
        if (requestId) service.cancelRequest(requestId as string)
      }
      config.headers.set('Authorization', token)
      return config
    },
    isRequestSuccess(resp) {
      console.log('resp', resp.data)
      return true
    },
  }
)

export async function getUserInfo() {
  const resp = await service<{ name: string; age: number }>({
    url: '/user',
  })
  console.log('回复', resp)
  return
}
