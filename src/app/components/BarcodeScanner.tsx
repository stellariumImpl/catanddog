"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Keyboard } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, mode]);

  const startScanning = async () => {
    if (isScanning.current) return;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      isScanning.current = true;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
          onClose();
        },
        () => {
          // Ignore errors during scanning
        }
      );
      setCameraError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('无法启动相机，请使用手动输入或检查相机权限');
      isScanning.current = false;
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        isScanning.current = false;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
      onClose();
    }
  };

  const handleClose = () => {
    stopScanning();
    setManualInput('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>扫描条码</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'camera' ? 'default' : 'outline'}
              onClick={() => setMode('camera')}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              相机扫码
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => setMode('manual')}
              className="flex-1"
            >
              <Keyboard className="mr-2 h-4 w-4" />
              手动输入
            </Button>
          </div>

          {/* Camera Mode */}
          {mode === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                  {cameraError}
                </div>
              ) : (
                <>
                  <div
                    id="qr-reader"
                    className="w-full aspect-square rounded-lg overflow-hidden bg-black"
                  />
                  <p className="text-sm text-gray-500 text-center">
                    将条码对准相机进行扫描
                  </p>
                </>
              )}
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="请输入条码或使用扫码枪"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  autoFocus
                  className="text-lg h-12"
                />
                <p className="text-sm text-gray-500 mt-2">
                  支持扫码枪直接输入或手动键入
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={!manualInput.trim()}>
                确认
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
