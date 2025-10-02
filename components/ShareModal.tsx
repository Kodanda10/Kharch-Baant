
import React from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageDataUrl: string;
    groupName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, imageDataUrl, groupName }) => {
    if (!isOpen) return null;

    const canShare = typeof navigator.share === 'function';

    const dataURLtoFile = (dataurl: string, filename: string): File | null => {
        const arr = dataurl.split(',');
        if (arr.length < 2) { return null; }
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) { return null; }
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = `summary-${groupName.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        const filename = `summary-${groupName.toLowerCase().replace(/\s+/g, '-')}.png`;
        const imageFile = dataURLtoFile(imageDataUrl, filename);
        
        if (imageFile && canShare) {
            const shareData = {
                files: [imageFile],
                title: `${groupName} Expense Summary`,
                text: `Here is the expense summary for our group: ${groupName}.`,
            };
            try {
                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                } else {
                    // Fallback for browsers that don't support `canShare` or can't share files
                    await navigator.share({ title: shareData.title, text: shareData.text });
                }
            } catch (error) {
                console.error('Sharing failed:', error);
                alert('Could not share the summary. Please try downloading it instead.');
            }
        } else {
            alert('Sharing is not supported on this browser. Please download the image.');
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-lg text-center">
                <h2 id="share-modal-title" className="text-2xl font-bold text-white mb-4">Share Summary</h2>
                <p className="text-slate-400 mb-4">Here's a snapshot of expenses for "{groupName}". You can download it or share it directly.</p>
                <div className="bg-black/20 p-2 rounded-lg mb-6">
                    <img src={imageDataUrl} alt="Expense Summary" className="max-w-full h-auto rounded-md" />
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 order-last sm:order-first">Close</button>
                    <button onClick={handleDownload} className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-500">Download Image</button>
                    {canShare && (
                         <button onClick={handleShare} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500">Share via...</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;