import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '../App'; // 引用主程式的 supabase client

interface AvatarUploadProps {
  userId: string;
  onUploadSuccess: (url: string) => void;
  currentAvatarUrl?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, onUploadSuccess, currentAvatarUrl }) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!image || !croppedAreaPixels) return;

    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = image;
    
    await new Promise((resolve) => (img.onload = resolve));

    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        200,
        200
      );
    }

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const blob = await createCroppedImage();
      if (!blob) return;

      const fileName = `${userId}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      onUploadSuccess(urlData.publicUrl);
      setImage(null);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group cursor-pointer">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-poker-gold/30 overflow-hidden bg-slate-800 flex items-center justify-center shadow-2xl transition-all group-hover:border-poker-gold">
          {currentAvatarUrl ? (
            <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-slate-500" />
          )}
        </div>
        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <Upload className="w-6 h-6 text-white" />
          <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
        </label>
      </div>

      {image && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          
          <div className="mt-8 flex gap-4 w-full max-w-md">
            <button onClick={() => setImage(null)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/10">
              <X className="w-5 h-5" /> 取消
            </button>
            <button onClick={handleUpload} disabled={isUploading} className="flex-1 py-4 bg-poker-gold text-poker-green rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-yellow-500 disabled:opacity-50">
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> 確定裁切</>}
            </button>
          </div>
          <div className="mt-6 w-full max-w-md">
            <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-poker-gold" />
            <p className="text-center text-slate-500 text-[10px] mt-2 uppercase tracking-widest">滑動調整縮放</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
