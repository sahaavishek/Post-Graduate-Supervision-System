"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { GraduationCap, BookOpen, Award, Users } from "lucide-react"
import "./auth.css"

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="auth-page">
      <div className={`auth-wrapper ${isSignUp ? 'panel-active' : ''} ${mounted ? 'mounted' : ''}`}>
        {/* Login Form Box */}
        <div className="auth-form-box login-form-box">
          <div className="auth-form">
            <LoginForm onSwitchToSignUp={() => setIsSignUp(true)} />
          </div>
        </div>

        {/* Register Form Box */}
        <div className="auth-form-box register-form-box">
          <div className="auth-form">
            <SignupForm onBackToLogin={() => setIsSignUp(false)} />
          </div>
        </div>

        {/* Slide Panel Wrapper */}
        <div className="slide-panel-wrapper">
          <div className="slide-panel">
            <div className="panel-content panel-content-left">
              <div className="education-icon-container">
                <GraduationCap className="education-icon" size={64} />
              </div>
              <h2>Begin Your Journey</h2>
              <p>Join our academic community and start your postgraduate research journey with expert supervision and comprehensive support</p>
              <div className="education-features">
                <div className="feature-item">
                  <BookOpen size={20} />
                  <span>Research Resources</span>
                </div>
                <div className="feature-item">
                  <Users size={20} />
                  <span>Expert Supervision</span>
                </div>
                <div className="feature-item">
                  <Award size={20} />
                  <span>Academic Excellence</span>
                </div>
              </div>
              <button
                type="button"
                className="transparent-btn"
                onClick={() => setIsSignUp(false)}
              >
                SIGN IN
              </button>
            </div>
            <div className="panel-content panel-content-right">
              <div className="education-icon-container">
                <GraduationCap className="education-icon" size={64} />
              </div>
              <h2>Welcome Back!</h2>
              <p>Continue your academic journey with seamless access to your research progress, meetings, and academic resources</p>
              <div className="education-features">
                <div className="feature-item">
                  <BookOpen size={20} />
                  <span>Track Progress</span>
                </div>
                <div className="feature-item">
                  <Users size={20} />
                  <span>Connect & Collaborate</span>
                </div>
                <div className="feature-item">
                  <Award size={20} />
                  <span>Achieve Milestones</span>
                </div>
              </div>
              <button
                type="button"
                className="transparent-btn"
                onClick={() => setIsSignUp(true)}
              >
                SIGN UP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
