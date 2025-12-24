// components/GoogleOAuthButton.tsx
'use client'

import React from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

interface GoogleOAuthButtonProps {
  onSuccess: (credentialResponse: CredentialResponse) => void
  onError: (error: string) => void
  dictionary: any
  disabled?: boolean
}

/**
 * Google OAuth 登录按钮组件
 * 
 * 功能说明：
 * 1. 集成 @react-oauth/google 的 GoogleLogin 组件
 * 2. 处理 Google OAuth 授权流程
 * 3. 支持多语言文案
 * 4. 支持禁用状态（登录过程中）
 * 
 * OAuth 流程：
 * 1. 用户点击按钮
 * 2. 弹出 Google 授权页面
 * 3. 用户授权后，Google 返回 credential (JWT token)
 * 4. 调用 onSuccess 回调，传递 credential
 * 5. 父组件使用 credential 调用后端 API 完成登录
 * 
 * @param onSuccess - 授权成功回调，接收 Google 返回的 credential
 * @param onError - 授权失败回调，接收错误信息
 * @param dictionary - 多语言字典
 * @param disabled - 是否禁用按钮（登录过程中）
 */
const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  dictionary,
  disabled = false
}) => {
  /**
   * 处理 Google 授权成功
   * @param credentialResponse - Google 返回的凭证响应，包含 JWT token
   */
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    console.log('[GoogleOAuth] Login success:', credentialResponse)
    onSuccess(credentialResponse)
  }

  /**
   * 处理 Google 授权失败
   * 可能的失败原因：
   * - 用户取消授权
   * - 网络错误
   * - Google 服务不可用
   */
  const handleError = () => {
    console.error('[GoogleOAuth] Login failed')
    onError(dictionary.auth?.errors?.googleAuthFailed || 'Google authentication failed')
  }

  return (
    <div className="w-full">
      {disabled ? (
        // 禁用状态：显示加载提示
        <div className="w-full py-2 px-4 border border-gray-300 rounded-md bg-gray-100 text-gray-400 text-center">
          {dictionary.auth?.loading || 'Loading...'}
        </div>
      ) : (
        // Google 登录按钮
        // 配置说明：
        // - useOneTap: false - 不使用 One Tap 自动登录
        // - theme: outline - 使用轮廓样式
        // - size: large - 大尺寸按钮
        // - text: continue_with - 显示 "Continue with Google"
        // - shape: rectangular - 矩形按钮
        // - logo_alignment: left - Google 图标左对齐
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap={false}
          theme="outline"
          size="large"
          width="100%"
          text="continue_with"
          shape="rectangular"
          logo_alignment="left"
        />
      )}
    </div>
  )
}

export default GoogleOAuthButton
