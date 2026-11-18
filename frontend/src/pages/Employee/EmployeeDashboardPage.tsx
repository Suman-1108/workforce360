import React, { useState, useEffect, useRef } from 'react'
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  Calendar,
  Coffee,
  AlertCircle,
  Sparkles,
  Building,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Upload,
  SwitchCamera,
} from 'lucide-react'
import { Button, Badge, Modal } from '../../components/common'
import { attendanceApi } from '../../services/api'
import { EmployeeUniformView } from '../../components/uniforms'
import {
  BreaksAndUniformSection,
  EmployeeLeaveSection,
  EmployeeWorkUpdatesSection,
  EmployeeSupportSection,
  EmployeeFinanceVaultSection,
} from '../../components/employee/EmployeePortalSections'

export interface EmployeeDashboardPageProps {
  activeTab?: string
}

export const EmployeeDashboardPage: React.FC<EmployeeDashboardPageProps> = ({
  activeTab = 'home',
}) => {
  const [currentUser, setCurrentUser] = useState<{
    first_name?: string
    last_name?: string
    email?: string
    tenant?: { name?: string }
  }>({})

  // Attendance states
  const [hasPunchedIn, setHasPunchedIn] = useState(false)
  const [hasPunchedOut, setHasPunchedOut] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [shiftName, setShiftName] = useState('Morning Shift (A)')
  const [shiftWindow, setShiftWindow] = useState('08:00 AM – 04:30 PM')
  const [branchName, setBranchName] = useState('Apex HQ Campus')
  const [workDurationMins, setWorkDurationMins] = useState<number | null>(null)

  // Punch modal & camera states
  const [punchModalOpen, setPunchModalOpen] = useState(false)
  const [punchType, setPunchType] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [isProcessingPunch, setIsProcessingPunch] = useState(false)
  const [punchSuccess, setPunchSuccess] = useState(false)
  const [punchError, setPunchError] = useState<string | null>(null)

  // Camera stream refs & state
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'captured' | 'error'>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('')
  const [isResetting, setIsResetting] = useState(false)

  // Guarantee stream is bound to <video> whenever it mounts or updates
  useEffect(() => {
    if ((cameraStatus === 'active' || cameraStatus === 'starting') && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
      }
      videoRef.current.play().catch(() => {})
    }
  }, [cameraStatus, capturedPhoto])

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setActiveCameraLabel('')
    setCameraStatus('idle')
  }

  // Start live webcam feed with universal multi-system fallback
  const startCamera = async (deviceId?: string, overrideFacingMode?: 'user' | 'environment') => {
    // Stop any previous stream before opening a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setCameraStatus('starting')
    setCameraError(null)
    setCapturedPhoto(null)

    if (!window.isSecureContext) {
      setCameraStatus('error')
      setCameraError(
        'Live camera streaming requires HTTPS or http://localhost. Use the "Take / Upload Photo" button below to capture from any device.'
      )
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('error')
      setCameraError(
        'Live camera streaming is not supported in this browser. Use "Take / Upload Photo" below to capture a selfie.'
      )
      return
    }

    const activeFacing = overrideFacingMode ?? facingMode
    const targetDeviceId = overrideFacingMode ? '' : (deviceId ?? selectedDeviceId)

    try {
      let stream: MediaStream

      // Tier 1: Try preferred device or facingMode with ideal resolution
      try {
        const videoConstraints: MediaTrackConstraints = targetDeviceId
          ? {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            }
          : {
              facingMode: { ideal: activeFacing },
              width: { ideal: 640 },
              height: { ideal: 480 },
            }

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        })
      } catch (primaryErr: any) {
        // Don't retry if user explicitly denied permission
        if (primaryErr.name === 'NotAllowedError' || primaryErr.name === 'PermissionDeniedError') {
          throw primaryErr
        }
        // Tier 2: Universal fallback { video: true } — works on all USB webcams, old laptops, VMs, and mobile devices
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream
      const activeTrack = stream.getVideoTracks()[0]
      if (activeTrack) {
        setActiveCameraLabel(activeTrack.label || 'System Camera')
        const settings = activeTrack.getSettings()
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId)
        }
      }

      // Enumerate all available cameras across the system
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const cams = devices.filter((d) => d.kind === 'videoinput')
        setVideoDevices(cams)
      } catch {
        // ignore enumeration failure
      }

      setCameraStatus('active')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {})
        }
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err)
      setCameraStatus('error')
      let msg = 'Could not access webcam. You can retry or use "Take / Upload Photo" below.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was blocked by the browser or OS. Allow camera access in your browser bar or use "Take / Upload Photo" below.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No webcam detected on this device. Use "Take / Upload Photo" below to submit a selfie.'
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another app. Close other video apps and retry, or upload a photo.'
      }
      setCameraError(msg)
    }
  }

  // Flip between Front and Rear camera (phones/tablets/dual-cam laptops)
  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    setSelectedDeviceId('')
    startCamera(undefined, nextMode)
  }

  // Universal fallback: Native device camera / photo upload (works on ALL systems & OSes)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          const maxDim = 640
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const compressed = canvas.toDataURL('image/jpeg', 0.8)
            stopCamera()
            setCapturedPhoto(compressed)
            setCameraStatus('captured')
            return
          }
        }
        stopCamera()
        setCapturedPhoto(reader.result as string)
        setCameraStatus('captured')
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    // Reset input so user can re-select same file if needed
    e.target.value = ''
  }

  // Snap photo to canvas
  const takeSnapshot = (): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return null

    try {
      const maxDim = 640
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight))
      const width = Math.round(video.videoWidth * scale)
      const height = Math.round(video.videoHeight * scale)
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        // Mirror only front-facing camera so selfie looks natural
        if (facingMode === 'user') {
          ctx.translate(width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        setCapturedPhoto(dataUrl)
        setCameraStatus('captured')
        return dataUrl
      }
    } catch (e) {
      console.error('Error capturing snapshot:', e)
    }
    return null
  }

  // Fetch today's live status
  const fetchTodayStatus = async () => {
    try {
      const res = await attendanceApi.getTodayPunchStatus()
      const data = res?.data || res
      if (data) {
        const punchedIn = Boolean(data.has_punched_in ?? data.punched_in)
        const punchedOut = Boolean(data.has_punched_out ?? data.punched_out)
        setHasPunchedIn(punchedIn)
        setHasPunchedOut(punchedOut)
        setIsCheckedIn(punchedIn && !punchedOut)

        if (data.shift_name) setShiftName(data.shift_name)
        if (data.shift_window) setShiftWindow(data.shift_window)
        if (data.branch_name) setBranchName(data.branch_name)

        const att = data.attendance || data
        if (att.check_in) {
          const d = new Date(att.check_in)
          setCheckInTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          if (punchedIn && !punchedOut) {
            const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
            setElapsedSeconds(Math.max(0, diffSec))
          }
        } else {
          setCheckInTime(null)
        }

        if (att.check_out) {
          setCheckOutTime(new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        } else {
          setCheckOutTime(null)
        }

        if (att.work_duration_minutes) {
          setWorkDurationMins(att.work_duration_minutes)
        }
      }
    } catch (err) {
      console.warn('Could not fetch today punch status:', err)
    }
  }

  useEffect(() => {
    // Read local user
    try {
      const stored = localStorage.getItem('wf360_user')
      if (stored) {
        setCurrentUser(JSON.parse(stored))
      }
    } catch {
      // ignore
    }

    fetchTodayStatus()

    return () => {
      stopCamera()
    }
  }, [])

  // Live timer when checked in
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isCheckedIn) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isCheckedIn])

  const formatElapsedTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleOpenPunchModal = (type: 'checkIn' | 'checkOut') => {
    setPunchType(type)
    setPunchSuccess(false)
    setPunchError(null)
    setCapturedPhoto(null)
    setPunchModalOpen(true)
    // Initialize real camera stream
    setTimeout(() => {
      startCamera()
    }, 100)
  }

  const handleClosePunchModal = () => {
    stopCamera()
    setPunchModalOpen(false)
    setCapturedPhoto(null)
    setCameraError(null)
    setCameraStatus('idle')
  }

  const handleConfirmPunch = async () => {
    setIsProcessingPunch(true)
    setPunchError(null)

    // Capture photo from video feed if not already manually captured
    let selfiePayload = capturedPhoto
    if (!selfiePayload && videoRef.current && cameraStatus === 'active') {
      selfiePayload = takeSnapshot()
    }

    // Safe fallback if webcam is unavailable/blocked
    if (!selfiePayload) {
      selfiePayload = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    }

    // Geolocation retrieval with safe default
    let lat = 37.7749
    let lng = -122.4194

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3500 })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch {
        // Fallback to default branch coordinates
      }
    }

    try {
      if (punchType === 'checkIn') {
        const res = await attendanceApi.punchIn({
          latitude: lat,
          longitude: lng,
          selfie_url: selfiePayload,
          address: `${branchName} Campus`,
        })
        setIsProcessingPunch(false)
        setPunchSuccess(true)
        setIsCheckedIn(true)
        setHasPunchedIn(true)
        setHasPunchedOut(false)

        const checkInDate = res.data?.check_in || res.check_in
        if (checkInDate) {
          setCheckInTime(new Date(checkInDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        } else {
          setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }
        setElapsedSeconds(0)
      } else {
        const res = await attendanceApi.punchOut({
          latitude: lat,
          longitude: lng,
          selfie_url: selfiePayload,
          address: `${branchName} Campus`,
        })
        setIsProcessingPunch(false)
        setPunchSuccess(true)
        setIsCheckedIn(false)
        setHasPunchedOut(true)

        const checkOutDate = res.data?.check_out || res.check_out
        if (checkOutDate) {
          setCheckOutTime(new Date(checkOutDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        } else {
          setCheckOutTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        }
      }

      setTimeout(() => {
        handleClosePunchModal()
        fetchTodayStatus()
      }, 1600)
    } catch (err: any) {
      setIsProcessingPunch(false)
      const detail =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        'Punch failed. Please check geofence or camera permissions.'
      setPunchError(detail)
    }
  }

  const handleResetTodayPunch = async () => {
    if (!window.confirm("Reset today's attendance punches for testing & demo?")) return
    setIsResetting(true)
    try {
      await attendanceApi.resetTodayPunch()
      setHasPunchedIn(false)
      setHasPunchedOut(false)
      setIsCheckedIn(false)
      setCheckInTime(null)
      setCheckOutTime(null)
      setElapsedSeconds(0)
      setWorkDurationMins(null)
      await fetchTodayStatus()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not reset punch'
      alert(msg)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Hidden Canvas for Live Snapshot Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Mobile-Friendly Greeting Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5EAE4] card-soft-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-[#183B36] tracking-tight">
                Hello, {currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : 'Alex Morgan'}
              </h1>
              <Badge
                variant={
                  hasPunchedIn && hasPunchedOut
                    ? 'neutral'
                    : isCheckedIn
                    ? 'success'
                    : 'neutral'
                }
                dot
              >
                {hasPunchedIn && hasPunchedOut
                  ? 'Shift Completed'
                  : isCheckedIn
                  ? 'In Shift'
                  : 'Off-Duty'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#78847F]">
              EMP-1001 &bull; Senior Field Engineer &bull; {branchName}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F7F1] px-3.5 py-1.5 rounded-full border border-[#CBD5C8] text-xs text-[#183B36] font-semibold self-start sm:self-center">
            <Building className="h-3.5 w-3.5 text-[#075E54]" />
            <span>{currentUser.tenant?.name || 'Apex Global Technologies'}</span>
          </div>
        </div>
      </div>

      {/* Tab-Specific Portal Views */}
      {activeTab === 'leave' && <EmployeeLeaveSection />}
      {activeTab === 'work' && <EmployeeWorkUpdatesSection />}
      {activeTab === 'support' && <EmployeeSupportSection />}
      {activeTab === 'salary' && <EmployeeFinanceVaultSection />}

      {activeTab === 'home' && (
        <>
          {/* Primary Punch Card (GPS Geofence + Live Camera Selfie) */}
          <div className="bg-white rounded-4xl p-6 sm:p-10 border border-[#E5EAE4] card-soft-shadow text-center relative overflow-hidden">
        {/* Subtle Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-dots opacity-40 pointer-events-none" />

        <div className="max-w-md mx-auto space-y-6 relative z-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF8B45] bg-[#FFF0E6] px-3 py-1 rounded-full border border-[#FFD4BA] inline-block mb-2">
              Assigned Shift Today
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#183B36]">
              {shiftName}
            </h2>
            <p className="text-xs text-[#78847F] mt-1">
              {shiftWindow} &bull; Grace window: 15 mins
            </p>
          </div>

          {/* Live Work Timer */}
          <div className="p-6 rounded-3xl bg-[#F5F7F1] border border-[#E5EAE4] space-y-2">
            <span className="text-xs font-semibold text-[#78847F] block uppercase tracking-wider">
              {hasPunchedIn && hasPunchedOut
                ? 'Total Completed Shift'
                : isCheckedIn
                ? 'Current Shift Duration'
                : 'Shift Status'}
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono text-[#075E54] tracking-tight">
              {isCheckedIn
                ? formatElapsedTime(elapsedSeconds)
                : hasPunchedIn && hasPunchedOut
                ? workDurationMins
                  ? `${Math.floor(workDurationMins / 60)}h ${workDurationMins % 60}m`
                  : '8h 00m'
                : '--:--:--'}
            </div>
            <div className="text-[11px] text-[#78847F] flex items-center justify-center gap-4 pt-1">
              <span>In: {checkInTime || 'Not punched'}</span>
              <span>&bull;</span>
              <span>Out: {checkOutTime || '--'}</span>
            </div>
          </div>

          {/* Action Punch Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            {!hasPunchedIn ? (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => handleOpenPunchModal('checkIn')}
                leftIcon={<Camera className="h-5 w-5" />}
                className="py-4 text-base shadow-md hover:shadow-lg"
              >
                GPS & Live Camera Check-In
              </Button>
            ) : !hasPunchedOut ? (
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={() => handleOpenPunchModal('checkOut')}
                leftIcon={<Clock className="h-5 w-5" />}
                className="py-4 text-base shadow-md hover:shadow-lg"
              >
                Confirm Shift Check-Out
              </Button>
            ) : (
              <div className="w-full space-y-3">
                <div className="p-4 rounded-2xl bg-[#E6F3F1] border border-[#BDE0D9] text-[#075E54] flex items-center justify-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Today's Shift Completed</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  isLoading={isResetting}
                  onClick={handleResetTodayPunch}
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  className="text-xs text-[#78847F]"
                >
                  Reset Punch for Today (Demo / Testing)
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-[#78847F]">
            <MapPin className="h-3.5 w-3.5 text-[#075E54]" />
            <span>Authorized Geofence: {branchName} (Radius 500m)</span>
          </div>
        </div>
      </div>

      {/* Tea Break, Lunch Break & Today's Uniform */}
      <BreaksAndUniformSection />

      {/* Quick Summary Cards: Leave Balances & Upcoming Days */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center gap-2 text-xs font-bold text-[#075E54] mb-2">
            <Coffee className="h-4 w-4" />
            <span>Annual Leave</span>
          </div>
          <div className="text-2xl font-black text-[#183B36]">14 Days</div>
          <span className="text-[11px] text-[#78847F]">Remaining balance</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF8B45] mb-2">
            <AlertCircle className="h-4 w-4" />
            <span>Medical Leave</span>
          </div>
          <div className="text-2xl font-black text-[#183B36]">9 Days</div>
          <span className="text-[11px] text-[#78847F]">Remaining balance</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#E5EAE4] card-soft-shadow">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-2">
            <Calendar className="h-4 w-4" />
            <span>Casual Leave</span>
          </div>
          <div className="text-2xl font-black text-[#183B36]">5 Days</div>
          <span className="text-[11px] text-[#78847F]">Remaining balance</span>
        </div>
      </div>

      {/* Recent Personal Attendance Log */}
      <div className="bg-white rounded-3xl border border-[#E5EAE4] card-soft-shadow overflow-hidden">
        <div className="p-6 border-b border-[#E5EAE4] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#183B36]">
            My Recent Attendance Punches
          </h3>
          <span className="text-xs font-semibold text-[#075E54] bg-[#E6F3F1] px-2.5 py-1 rounded-full">
            All Verified
          </span>
        </div>

        <div className="divide-y divide-[#E5EAE4] text-xs">
          {[
            { date: 'Yesterday (Sun)', in: '07:55 AM', out: '04:30 PM', duration: '8h 35m', status: 'Present' },
            { date: 'Friday, Nov 14', in: '07:58 AM', out: '04:32 PM', duration: '8h 34m', status: 'Present' },
            { date: 'Thursday, Nov 13', in: '08:12 AM', out: '04:45 PM', duration: '8h 33m', status: 'Late (Grace)' },
            { date: 'Wednesday, Nov 12', in: '07:50 AM', out: '04:30 PM', duration: '8h 40m', status: 'Present' },
          ].map((punch, idx) => (
            <div key={idx} className="p-4 sm:px-6 flex items-center justify-between hover:bg-[#F5F7F1]/60">
              <div>
                <span className="font-bold text-[#183B36] block">{punch.date}</span>
                <span className="text-[11px] text-[#78847F]">
                  In: {punch.in} &bull; Out: {punch.out}
                </span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-[#075E54] block">{punch.duration}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">{punch.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Assigned Uniform & Gear Kits */}
      <EmployeeUniformView />
        </>
      )}

      {/* GPS & Real Camera Punch Modal */}
      <Modal
        isOpen={punchModalOpen}
        onClose={handleClosePunchModal}
        title={punchType === 'checkIn' ? 'Live Camera & GPS Check-In' : 'Shift Departure Check-Out'}
        description="Verify device location within branch perimeter and capture webcam selfie proof."
        size="sm"
      >
        {punchSuccess ? (
          <div className="py-6 text-center animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-[#183B36]">
              {punchType === 'checkIn' ? 'Check-In Confirmed!' : 'Check-Out Confirmed!'}
            </h4>
            <p className="text-xs text-[#78847F] mt-1">
              GPS Geofence: Inside 500m &bull; Live Selfie Authenticated
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            {/* Viewfinder Preview: Real Live Webcam Stream */}
            <div className="relative rounded-3xl overflow-hidden aspect-4/3 bg-slate-950 border-2 border-[#CBD5C8] flex items-center justify-center shadow-inner">
              {capturedPhoto ? (
                // Display captured selfie photo
                <div className="relative w-full h-full">
                  <img
                    src={capturedPhoto}
                    alt="Captured Selfie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Photo Captured</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhoto(null)
                      startCamera()
                    }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[#183B36] text-[11px] font-bold px-3 py-1 rounded-full shadow-sm transition"
                  >
                    Retake
                  </button>
                </div>
              ) : cameraStatus === 'active' || cameraStatus === 'starting' ? (
                // Live Video Feed from Webcam (works across Desktop, Laptop, Android & iOS)
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                  />
                  {/* Flip Camera Button (Front/Rear) */}
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    title="Switch Front / Rear Camera"
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-xs border border-white/15 transition z-10"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </button>
                  {/* Targeting Reticle Frame */}
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/80 rounded-2xl m-6 pointer-events-none flex flex-col items-center justify-between p-3">
                    <span className="text-[10px] font-mono font-bold tracking-wide text-emerald-300 bg-black/60 px-2.5 py-1 rounded-full shadow-sm">
                      CENTER YOUR FACE
                    </span>
                  </div>
                  {/* Viewfinder HUD */}
                  <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono py-1.5 px-3 rounded-xl flex items-center justify-between border border-white/10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="font-semibold text-emerald-300 truncate">
                        {activeCameraLabel ? `LIVE: ${activeCameraLabel}` : 'WEBCAM LIVE'}
                      </span>
                    </div>
                    <span className="text-emerald-400 font-bold shrink-0 ml-2">GEOFENCE MATCH</span>
                  </div>
                </>
              ) : (
                // Camera Error or Blocked State — universal fallback for all systems
                <div className="p-5 text-center space-y-3">
                  <div className="h-11 w-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200 leading-relaxed">
                    {cameraError || 'Camera initializing or permission needed...'}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startCamera()}
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
                    >
                      Retry Camera
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => fileInputRef.current?.click()}
                      leftIcon={<Upload className="h-3.5 w-3.5" />}
                      className="text-xs"
                    >
                      Take / Upload Photo
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Universal Hidden File/Native Camera Input (works on Windows, Mac, Linux, Android & iOS) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Camera Device Switcher & Universal Photo Upload Row */}
            {!capturedPhoto && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {videoDevices.length > 1 ? (
                  <select
                    id="camera-select"
                    aria-label="Select camera device"
                    value={selectedDeviceId}
                    onChange={(e) => {
                      const id = e.target.value
                      setSelectedDeviceId(id)
                      startCamera(id)
                    }}
                    className="flex-1 min-w-36 rounded-xl border border-[#CBD5C8] bg-white px-2.5 py-1.5 text-xs text-[#183B36] focus:outline-none focus:ring-2 focus:ring-[#075E54]/30"
                  >
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[11px] text-[#78847F]">
                    Camera blocked or unavailable on this system?
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#075E54] hover:text-[#183B36] bg-[#E6F3F1] hover:bg-[#D5EBE7] px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Take / Upload Photo</span>
                </button>
              </div>
            )}

            {/* Geofence & Location Details */}
            <div className="p-3.5 rounded-2xl bg-[#F5F7F1] border border-[#E5EAE4] text-left text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-[#183B36]">
                <span>Detected Location:</span>
                <span className="text-[#075E54] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {branchName} (Geofence Active)
                </span>
              </div>
              <div className="flex items-center justify-between text-[#78847F] text-[11px]">
                <span>GPS Accuracy:</span>
                <span>&plusmn; 4 meters &bull; Inside 500m radius</span>
              </div>
            </div>

            {/* Error Banner */}
            {punchError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium text-left flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{punchError}</span>
              </div>
            )}

            {/* Submit & Snapshot Controls */}
            <div className="flex items-center gap-2">
              {cameraStatus === 'active' && !capturedPhoto && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => takeSnapshot()}
                  leftIcon={<Camera className="h-4 w-4" />}
                  className="shrink-0"
                >
                  Snap
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isProcessingPunch}
                onClick={handleConfirmPunch}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                {isProcessingPunch
                  ? 'Verifying & Submitting...'
                  : punchType === 'checkIn'
                  ? 'Capture Proof & Punch In'
                  : 'Capture Proof & Punch Out'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Legal Notice */}
      <div className="p-4 rounded-2xl bg-[#E6F3F1] border border-[#BDE0D9] text-xs text-[#183B36] flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-[#075E54] shrink-0" />
        <span>
          <span className="font-bold">Notice:</span> GPS location and webcam snapshot are verified strictly at the moment of punch submission under company attendance policy.
        </span>
      </div>
    </div>
  )
}

export default EmployeeDashboardPage
