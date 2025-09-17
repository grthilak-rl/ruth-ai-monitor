import React, { useState } from 'react';

const CameraCarousel = ({ cameras, currentCameraIndex, setCurrentCameraIndex }) => {
  if (!cameras || cameras.length === 0) {
    return <div className="text-center text-muted-foreground">No cameras available.</div>;
  }

  const currentCamera = cameras[currentCameraIndex];

  const [isHovered, setIsHovered] = useState(false);

  const handlePrev = () => {
    setCurrentCameraIndex((prevIndex) =>
      prevIndex === 0 ? cameras.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentCameraIndex((prevIndex) =>
      prevIndex === cameras.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden aspect-video"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentCamera ? (
        <video
          src={currentCamera.feedUrl || ''}
          alt={currentCamera.name}
          className="object-cover w-full h-full"
          autoPlay
          loop
          muted
        />
      ) : (
        <div className="text-white">Select a camera to view its feed.</div>
      )}

      {isHovered && cameras.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 p-2 bg-black bg-opacity-50 text-white rounded-full focus:outline-none"
          >
            &#9664; {/* Left arrow */}
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 p-4 bg-black bg-opacity-50 text-white rounded-full focus:outline-none"
          >
            &#9654; {/* Right arrow */}
          </button>
        </>
      )}
    </div>
  );
};

export default CameraCarousel;