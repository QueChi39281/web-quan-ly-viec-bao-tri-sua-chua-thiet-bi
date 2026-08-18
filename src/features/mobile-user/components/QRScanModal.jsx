import React, { useEffect, useRef, useState } from 'react';

export default function QRScanModal({ isOpen, onClose, onScanResult }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const startCamera = async () => {
      setError('');
      setIsScanning(false);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Thiết bị này không hỗ trợ truy cập camera. Bạn có thể tải ảnh QR lên để quét.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const detectLoop = async () => {
            if (!videoRef.current || !streamRef.current) return;

            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const value = barcodes[0]?.rawValue || '';
                if (value) {
                  stopCamera();
                  onScanResult(value.trim());
                  return;
                }
              }
            } catch (scanError) {
              console.warn('Không đọc được QR từ camera:', scanError);
            }

            if (isOpen) {
              requestAnimationFrame(detectLoop);
            }
          };

          setIsScanning(true);
          detectLoop();
        } else {
          setError('Trình duyệt của bạn chưa hỗ trợ quét QR trực tiếp. Hãy dùng chức năng tải ảnh từ thiết bị.');
        }
      } catch (cameraError) {
        console.error('Không thể mở camera:', cameraError);
        setError('Không thể mở camera. Vui lòng kiểm tra quyền truy cập hoặc tải ảnh QR từ thiết bị.');
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, onScanResult]);

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!('BarcodeDetector' in window)) {
      setError('Trình duyệt của bạn chưa hỗ trợ quét mã QR trên ảnh.');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(img);

        if (barcodes && barcodes.length > 0) {
          const value = barcodes[0]?.rawValue || '';
          if (value) {
            onScanResult(value.trim());
            return;
          }
        }

        setError('Không đọc được mã QR trong ảnh đã tải lên. Vui lòng thử ảnh khác.');
      } catch (scanError) {
        console.error('Không thể quét QR từ ảnh:', scanError);
        setError('Ảnh không hợp lệ hoặc không đọc được mã QR.');
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    };

    img.onerror = () => {
      setError('Không thể đọc ảnh đã chọn.');
      URL.revokeObjectURL(imageUrl);
    };

    img.src = imageUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h3>Quét mã QR</h3>
          <button type="button" className="qr-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="qr-camera-wrap">
          <video ref={videoRef} autoPlay playsInline muted className="qr-camera-video" />
          <div className="qr-scan-frame" aria-hidden="true">
            <span className="scan-corner top-left" />
            <span className="scan-corner top-right" />
            <span className="scan-corner bottom-left" />
            <span className="scan-corner bottom-right" />
            <span className="scan-laser" />
          </div>
        </div>

        {error && <div className="qr-error-message">{error}</div>}

        <div className="qr-actions-row">
          <label className="qr-upload-btn">
            Tải ảnh từ thiết bị
            <input type="file" accept="image/*" onChange={handleUploadImage} />
          </label>
          <button type="button" className="qr-modal-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
