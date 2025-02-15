'use client'

import { useRef, useState, useEffect } from "react";
import { RectangleHorizontal, Circle, File,  Delete, Columns4 } from "lucide-react";
import { drawPolygonAnnotation, drawAnnotation, ClassList,  renderAnnotations, AnnotationModal, saveAnnotation } from "../../components/utils";
import {RectangleIcon, PolygonIcon, Edit}  from "../../tool_icons/rectangle";

import { useImageLoader } from "../hooks/useImageLoader";

export default function Home() {
  
  const containerRef = useRef(null);  
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);

  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [originalSizeImage, setOriginalSize] = useState({ width: 0, height: 0 });
  const [imageSrc, setImageSrc] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [relativeCursor, setRelativeCursor] = useState({ x: 0, y: 0 });
  const [imageCoordinates, setImageCoordinates] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // states for panning and zooming
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageStartOffset, setImageStartOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  

  // States for annotation tool
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState({});
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [currentTool, setCurrentTool] = useState("pan");

  // state for selected annotation
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);

  // state for editting anchors
  const [showAnchors, setShowAnchors] = useState(false);

  // states for resizing an annotation via it's anchors

  const [resizingAnnotationIndex, setResizingAnnotationIndex]= useState(null);
  const [resizingCorner, setResizingCorner] = useState(""); //"tl", "tr", "bl", "br"

  // show the annotation modal
  const  [ showModal, setShowModal] = useState(false);


  // setup the image loader and image side bar toggling
  const {images, _, loading, fetchImages, loadNextImage, loadPrevImage} = useImageLoader();
  const [isImageSidebarOpen, setIsImageSidebarOpen] = useState(false);
  const [currentImage, setCurrentImage] =  useState()
  

  const [hoveredClass, setHoveredClass] = useState(null);
  const [ toggleListItem,setToggleListItem] = useState("");
  // console.log(images)
  function startEditing()
  {
    if (showAnchors === true){
    setShowAnchors(false);}
    else {
      if (showAnchors === false){
        setShowAnchors(true);
      }
    }
  }
  const TOOLS ={
    "RECTANGLE": "rectangle",
    "CIRCLE": "circle",
    "LINE": "line",
    "POLYGON": "polygon",
    "PAN":"pan"
  };
  
useEffect ( ()=>{
  console.log("Annotations:", annotations)
},
  [annotations]
)
  

  // Handling Delete Button Click

  function handleDeleteAnnotation() {
    if (selectedAnnotationIndex !== null) {
      const updatedAnnotations = annotations.filter((_, idx) => idx !== selectedAnnotationIndex);
      setAnnotations(updatedAnnotations);
      setSelectedAnnotationIndex(null);
      renderAnnotations(imageContainerRef.current, updatedAnnotations, scale, offset);
    }
  }


  // fetch images from the database
  useEffect(()=>{
    fetchImages();
    console.log(images)
    // setImageSrc(images[0].signedUrl);
  },[fetchImages]);



  // Redrawing the annotations with the updated scale and offset
  useEffect(() => {
    const updateCanvas = () => {
      renderAnnotations(imageContainerRef.current, annotations, scale, offset);
    };
    requestAnimationFrame(updateCanvas);
  }, [annotations, scale, offset]);


  // Handling window resize
  useEffect(() => {
    function handleResize() {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
    handleResize()
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Attach non-passive wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale, offset, originalSizeImage]);
  
  const toggleSidebar = ()=> setIsImageSidebarOpen(!isImageSidebarOpen);




  // Setup the image url with the state

  async function handleImageStates(imageUrl) {
    try {
      // Convert the S3 signed URL to base64
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
  
      // Create a new image element and set its source to the base64 string
      const img = new Image();
      img.src = base64;
  
      img.onload = () => {
        imageRef.current = img;
        const imageWidth = img.width;
        const imageHeight = img.height;
  
        // Update original size using actual image values
        setOriginalSize({ width: imageWidth, height: imageHeight });
        setImageSrc(base64); // Use the base64 string as the image source
  
        const container = containerRef.current;
        const { clientWidth, clientHeight } = container;
        const initialScale = Math.min(clientWidth / imageWidth, clientHeight / imageHeight);
        setScale(initialScale);
  
        const imgx = (clientWidth - imageWidth * initialScale) / 2;
        const imgy = (clientHeight - imageHeight * initialScale) / 2;
        setOffset({ x: imgx, y: imgy });
  
        // Use actual image dimensions multiplied by the scale
        setImageCoordinates({
          x: imgx,
          y: imgy,
          width: imageWidth * initialScale,
          height: imageHeight * initialScale,
        });
      };
    } catch (error) {
      console.error("Error loading image:", error);
    }
  }

  const handleImageClick= (index) =>{

    // console.log(images[index].src)
    handleImageStates(images[index].url);
    setCurrentImage(images[index])
    console.log(images[index].annotations)
    

    
    console.log("Images Set to :", index, images[index].url);
  }
  // Handling image upload and positioning the image inside the container
  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;

      img.onload = () => {
        imageRef.current = img;
        const imageWidth = img.width;
        const imageHeight = img.height;
        // Update original size using actual image values.
        setOriginalSize({ width: imageWidth, height: imageHeight });
        setImageSrc(result);
        console.log(result)

        const container = containerRef.current;
        const { clientWidth, clientHeight } = container;
        const initialScale = Math.min(clientWidth / imageWidth, clientHeight / imageHeight);
        setScale(initialScale);
        const imgx = (clientWidth - imageWidth * initialScale) / 2;
        const imgy = (clientHeight - imageHeight * initialScale) / 2;
        console.log(imgx, imgy, imageWidth, imageHeight, initialScale)
        setOffset({ x: imgx, y: imgy });
        // Use actual image dimensions multiplied by the scale.
        setImageCoordinates({
          x: imgx,
          y: imgy,
          width: imageWidth * initialScale,
          height: imageHeight * initialScale
        });
      }
      img.src = result;
    }
    reader.readAsDataURL(file);
  }

  // function handleMouseMove(e) {
  //   // Get mouse position relative to container
  //   const containerRect = containerRef.current.getBoundingClientRect();
  //   const localX = e.clientX - containerRect.left;
  //   const localY = e.clientY - containerRect.top;
  //   setCursorPos({ x: localX, y: localY });
  //   // If currently resizing an annotation via an anchor
  //   if (resizingAnnotationIndex !== null) {
  //       const relX = (localX - offset.x) / scale;
  //       const relY = (localY - offset.y) / scale;
  //       const updatedAnnotations = [...annotations];
  //       const ann = { ...updatedAnnotations[resizingAnnotationIndex] };
  


  //       if (currentTool === TOOLS.POLYGON && isAnnotating) {
  //         // drawPolygonAnnotation expects: container, annotation, scale, offset, currentPos
  //         drawPolygonAnnotation(
  //           imageContainerRef.current,
  //           currentAnnotation,
  //           scale,
  //           offset,
  //           { x: localX, y: localY }
  //         );
  //         return;
  //       }
  //   // Annotation Resizing using Anchors
  //       // Depending on which corner is active, compute new x, y, width, height.
  //       if (resizingCorner === "tl") {
  //         // bottom-right remains constant
  //         const brX = ann.x + ann.width;
  //         const brY = ann.y + ann.height;
  //         ann.x = relX;
  //         ann.y = relY;
  //         ann.width = brX - relX;
  //         ann.height = brY - relY;
  //       } else if (resizingCorner === "tr") {
  //         // bottom-left remains constant
  //         const blX = ann.x;
  //         const blY = ann.y + ann.height;
  //         ann.y = relY;
  //         ann.width = relX - ann.x;
  //         ann.height = blY - relY;
  //       } else if (resizingCorner === "bl") {   
  //         // top-right remains constant
  //         const trX = ann.x + ann.width;
  //         const trY = ann.y;
  //         ann.x = relX;
  //         ann.width = trX - relX;
  //         ann.height = relY - ann.y;
  //       } else if (resizingCorner === "br") {
  //         // top-left remains constant
  //         ann.width = relX - ann.x;
  //         ann.height = relY - ann.y;
  //       }
  //       updatedAnnotations[resizingAnnotationIndex] = ann;
  //       setAnnotations(updatedAnnotations);
  //       // Also update the canvas drawing
  //       renderAnnotations(imageContainerRef.current, updatedAnnotations, scale, offset);
  //       return; // Skip other actions if resizing.
  //     }


  //   if (isAnnotating){
  //       const relX = (localX - offset.x)/scale;
  //       const relY = (localY - offset.y)/scale;
  //       const updatedAnnotation = { ...currentAnnotation, width: relX - currentAnnotation.x, height: relY - currentAnnotation.y,};
  //       setCurrentAnnotation(updatedAnnotation)
  //       drawAnnotation(imageContainerRef.current, updatedAnnotation, scale, offset);
  //   }

  //   // Process panning if dragging
  //   if (isDragging) {
  //     const dx = e.clientX - dragStart.x;
  //     const dy = e.clientY - dragStart.y;
  //     setOffset({ x: imageStartOffset.x + dx, y: imageStartOffset.y + dy });
  //     setImageCoordinates(prev => ({
  //       ...prev,
  //       x: imageStartOffset.x + dx,
  //       y: imageStartOffset.y + dy
  //     }));
  //   }

  //   // Check if mouse is inside the image region and calculate original image coordinates
  //   const imgWidth = originalSizeImage.width * scale;
  //   const imgHeight = originalSizeImage.height * scale;
  //   if (localX >= offset.x && localX <= offset.x + imgWidth &&
  //       localY >= offset.y && localY <= offset.y + imgHeight) {
  //     const relativeX = (localX - offset.x) / scale;
  //     const relativeY = (localY - offset.y) / scale;
  //     setRelativeCursor({ x: relativeX, y: relativeY });
  //   }
  // }
  function handleMouseMove(e) {
    const containerRect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - containerRect.left;
    const localY = e.clientY - containerRect.top;
    setCursorPos({ x: localX, y: localY });
  
    // If the polygon tool is active and you are annotating,
    // always draw the in-progress polygon (its points and line to current mouse position)
    if (currentTool === TOOLS.POLYGON && isAnnotating) {
      drawPolygonAnnotation(
        imageContainerRef.current,
        currentAnnotation,
        scale,
        offset,
        { x: localX, y: localY }
      );
    } else if (isAnnotating) {
      // For rectangle (or others) annotation mode.
      const relX = (localX - offset.x) / scale;
      const relY = (localY - offset.y) / scale;
      const updatedAnnotation = {
        ...currentAnnotation,
        width: relX - currentAnnotation.x,
        height: relY - currentAnnotation.y,
      };
      setCurrentAnnotation(updatedAnnotation);
      drawAnnotation(imageContainerRef.current, updatedAnnotation, scale, offset);
    }
  
    // Process anchor-resizing when active.
    if (resizingAnnotationIndex !== null) {
      const relX = (localX - offset.x) / scale;
      const relY = (localY - offset.y) / scale;
      const updatedAnnotations = [...annotations];
      const ann = { ...updatedAnnotations[resizingAnnotationIndex] };

        if (ann.type === "polygon") {
          const pointIndex = parseInt(resizingCorner, 10);
          if (!isNaN(pointIndex) && ann.points && Array.isArray(ann.points) && pointIndex >= 0 && pointIndex < ann.points.length && ann.points[pointIndex]) {
            const newPoints =[...ann.points]
            newPoints[pointIndex] = { x: relX, y: relY };
            const newAnnotation = {...ann, points: newPoints};
            updatedAnnotations[resizingAnnotationIndex] = newAnnotation;
            setAnnotations(updatedAnnotations);
            renderAnnotations(imageContainerRef.current, updatedAnnotations, scale, offset);
            return;
          }
            // ann.points = newPoints;
            // updatedAnnotations[resizingAnnotationIndex] = ann;
            // setAnnotations(updatedAnnotations);
            // renderAnnotations(imageContainerRef.current, updatedAnnotations, scale, offset);
            // return;
          // }
        } else {
          if (resizingCorner === "tl") {
            const brX = ann.x + ann.width;
            const brY = ann.y + ann.height;
            ann.x = relX;
            ann.y = relY;
            ann.width = brX - relX;
            ann.height = brY - relY;
          } else if (resizingCorner === "tr") {
            const blX = ann.x;
            const blY = ann.y + ann.height;
            ann.y = relY;
            ann.width = relX - ann.x;
            ann.height = blY - relY;
          } else if (resizingCorner === "bl") {
            const trX = ann.x + ann.width;
            const trY = ann.y;
            ann.x = relX;
            ann.width = trX - relX;
            ann.height = relY - ann.y;
          } else if (resizingCorner === "br") {
            ann.width = relX - ann.x;
            ann.height = relY - ann.y;
          }
          updatedAnnotations[resizingAnnotationIndex] = ann;
          setAnnotations(updatedAnnotations);
          renderAnnotations(imageContainerRef.current, updatedAnnotations, scale, offset);
          return; // Skip other tasks when resizing.
        }
      }
  
    // Process panning if dragging.
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setOffset({ x: imageStartOffset.x + dx, y: imageStartOffset.y + dy });
      e.preventDefault()
      setImageCoordinates(prev => ({
        ...prev,
        x: imageStartOffset.x + dx,
        y: imageStartOffset.y + dy,
      }));
    }
  
    // Update relative cursor coordinates when inside the image.
    const imgWidth = originalSizeImage.width * scale;
    const imgHeight = originalSizeImage.height * scale;
    if (
      localX >= offset.x &&
      localX <= offset.x + imgWidth &&
      localY >= offset.y &&
      localY <= offset.y + imgHeight
    ) {
      const relativeX = (localX - offset.x) / scale;
      const relativeY = (localY - offset.y) / scale;
      setRelativeCursor({ x: relativeX, y: relativeY });
    }
  }

  function handleMouseDown(e) {

    if (showModal) {
      e.stopPropagation();
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect()
    const localX = e.clientX - containerRect.left;
    const localY = e.clientY - containerRect.top;
    // Check if click is inside any existing annotation
    
    if (currentTool === TOOLS.POLYGON) {
      const relX = (localX - offset.x) / scale;
      const relY = (localY - offset.y) / scale;
  
      if (!isAnnotating) {
        // Start new polygon with the first point in an array.
        const newAnnotation = {type : "polygon", points: [{ x: relX, y: relY }] };
        setIsAnnotating(true);
        setCurrentAnnotation(newAnnotation);
      } else {
        const points = currentAnnotation.points;
        const firstPoint = points[0];
        const dist = Math.hypot(firstPoint.x - relX, firstPoint.y - relY);
        // Use a threshold (e.g., 10 pixels) to detect a click near the first point.
        if (points.length >= 3 && dist * scale < 10) {
          console.log("Polygon closed");
          // Complete the polygon.
          const completedPolygon = { ...currentAnnotation, isClosed: true };
          setAnnotations([...annotations, completedPolygon]);
          setIsAnnotating(false);
          setShowModal(true);
          const transientCanvas = imageContainerRef.current.querySelector("canvas.transient-annotation-canvas")
          if (transientCanvas) {
            imageContainerRef.current.removeChild(transientCanvas);
          }
        
        } else {
          // Append a new point.
          const newPoints = [...points, {x:relX, y:relY}];
          const newAnnotation = {...currentAnnotation, points: newPoints}
          setCurrentAnnotation(newAnnotation);
          drawAnnotation(imageContainerRef.current, newAnnotation, scale, offset, { x: localX, y: localY });
        }
      }
      return;
    } 
        
      
    





    for (let i = 0; i < annotations.length; i++) {
      const ann = annotations[i];
      const annRect = {
        x: offset.x + ann.x * scale,
        y: offset.y + ann.y * scale,
        width: ann.width * scale,
        height: ann.height * scale
      };
      if (
        localX >= annRect.x &&
        localX <= annRect.x + annRect.width &&
        localY >= annRect.y &&
        localY <= annRect.y + annRect.height
      ) {
        setSelectedAnnotationIndex(i);
        return; // Stop further processing if an annotation is selected.
      }
    }
    // Clear selection if none was hit.
    setSelectedAnnotationIndex(null);


    if (
        localX >= offset.x &&
        localX <= offset.x + originalSizeImage.width * scale &&
        localY >= offset.y &&
        localY <= offset.y + originalSizeImage.height * scale
    ){
        if (currentTool === TOOLS.RECTANGLE){
          // e.preventDefault()
            const relX  = (localX - offset.x) /scale;
            const relY = (localY - offset.y) /scale;
            setIsAnnotating(true);
            setCurrentAnnotation({x: relX, y: relY, width: 0, height: 0});
            } else  {
              e.preventDefault()
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            setImageStartOffset(offset);
        }
    }





   



  }
  function handleMouseUp() {
    if (showModal) {
      return;
    }
    if (currentTool !== TOOLS.POLYGON && isAnnotating) {
      const newAnnotations = [...annotations, currentAnnotation];
      setAnnotations(newAnnotations);
      setCurrentAnnotation({ ...currentAnnotation });
      setIsAnnotating(false);
      setShowModal(true);
        
        const transientCanvas = imageContainerRef.current.querySelector("canvas.transient-annotation-canvas");
    if (transientCanvas) {
      imageContainerRef.current.removeChild(transientCanvas);
    }
        // redrawAnnotations(imageContainerRef.current, newAnnotations, scale, offset)
    }
    if (resizingAnnotationIndex !== null) {
        setResizingAnnotationIndex(null);
        setResizingCorner("");
      }
    setIsDragging(false);
  }

  // Zoom handling now using container as reference and correct image dimensions
  function handleWheel(e) {
    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const delta = -e.deltaY;
    const zoomFactor = 0.001;
    let newScale = scale + delta * zoomFactor;
    newScale = Math.max(newScale, 0.1);

    // Compute new offset preserving cursor position
    const newImgX = mouseX - ((mouseX - offset.x) * newScale) / scale;
    const newImgY = mouseY - ((mouseY - offset.y) * newScale) / scale;

    setScale(newScale);
    setOffset({ x: newImgX, y: newImgY });
    setImageCoordinates({
      x: newImgX,
      y: newImgY,
      width: originalSizeImage.width * newScale,
      height: originalSizeImage.height * newScale
    });
  }


  // Rectangle tool Handling setting the current tool and isAnnotation "True"
  function handleRectangleToolClick(){
    if (currentTool === TOOLS.RECTANGLE){
      setIsAnnotating(false)
    setCurrentTool(TOOLS.PAN)} else {
      setCurrentTool(TOOLS.RECTANGLE)}
    // setIsAnnotating(true)
    console.log('Rectangle Tool Clicked')
  }


  // Handle Rendering while anchor are dragging
  function handleAnchorMouseDown(index, corner, e) {
    // Prevent triggering other mouse down events (like starting an annotation)
    e.stopPropagation();
    e.preventDefault()
    setResizingAnnotationIndex(index);
    setResizingCorner(corner);
  }

  function handlePolygonAnchorMouseDown(annotationIndex, pointIndex, e) {
    e.stopPropagation();
    e.preventDefault()
    setResizingAnnotationIndex(annotationIndex);
    // Use the point index (as a string) in place of the corner name.
    setResizingCorner(pointIndex.toString());
  }

  // Render Anchors for Resizing

  function renderAnchors() {
    return annotations.map((ann, idx) => {
      if (ann.type === "polygon" && ann.points && ann.points.length > 0) {
        // Render an anchor for each vertex.
        return ann.points.map((point, pointIndex) => (
          <div
            key={`ann-${idx}-point-${pointIndex}`}
            className="anchor"
            onMouseDown={(e) => handlePolygonAnchorMouseDown(idx, pointIndex, e)}
            style={{
              position: "absolute",
              left: point.x * scale + offset.x - 4,
              top: point.y * scale + offset.y - 4,
              width: 8,
              height: 8,
              backgroundColor: "red",
              cursor: "pointer",
              zIndex: 30,
            }}
          />
        ));
      } else {
        // Existing rendering for rectangle anchors.
        const topLeft = { x: offset.x + ann.x * scale, y: offset.y + ann.y * scale };
        const topRight = {
          x: offset.x + (ann.x + ann.width) * scale,
          y: offset.y + ann.y * scale,
        };
        const bottomLeft = {
          x: offset.x + ann.x * scale,
          y: offset.y + (ann.y + ann.height) * scale,
        };
        const bottomRight = {
          x: offset.x + (ann.x + ann.width) * scale,
          y: offset.y + (ann.y + ann.height) * scale,
        };
  
        return (
          <div key={`ann-${idx}`}>
            <div
              className="anchor"
              onMouseDown={(e) => handleAnchorMouseDown(idx, "tl", e)}
              style={{
                position: "absolute",
                left: topLeft.x - 4,
                top: topLeft.y - 4,
                width: 8,
                height: 8,
                backgroundColor: "blue",
                cursor: "nwse-resize",
                zIndex: 30,
              }}
            />
            <div
              className="anchor"
              onMouseDown={(e) => handleAnchorMouseDown(idx, "tr", e)}
              style={{
                position: "absolute",
                left: topRight.x - 4,
                top: topRight.y - 4,
                width: 8,
                height: 8,
                backgroundColor: "blue",
                cursor: "nesw-resize",
                zIndex: 30,
              }}
            />
            <div
              className="anchor"
              onMouseDown={(e) => handleAnchorMouseDown(idx, "bl", e)}
              style={{
                position: "absolute",
                left: bottomLeft.x - 4,
                top: bottomLeft.y - 4,
                width: 8,
                height: 8,
                backgroundColor: "blue",
                cursor: "nesw-resize",
                zIndex: 30,
              }}
            />
            <div
              className="anchor"
              onMouseDown={(e) => handleAnchorMouseDown(idx, "br", e)}
              style={{
                position: "absolute",
                left: bottomRight.x - 4,
                top: bottomRight.y - 4,
                width: 8,
                height: 8,
                backgroundColor: "blue",
                cursor: "nwse-resize",
                zIndex: 30,
              }}
            />
          </div>
        );
      }
    });
  }


function handlePolygonToolClick(){
  if (currentTool === TOOLS.POLYGON){
    setCurrentTool(TOOLS.PAN);
    setIsAnnotating(false)
    setCurrentAnnotation({})

  } else {
    setCurrentTool(TOOLS.POLYGON);
    setIsAnnotating(false)
    setCurrentAnnotation({type: "polygon", points:[]})
  }
  console.log("polygon tool clicked")
}



  return (
    <div className="min-h-screen bg-[#384150] flex flex-col items-center p-4" style={{ position: "relative" }}>
       
       
      {/* Right fixed space */}
      {/* <div className="absolute top-0 right-0 h-full w-[5%] bg-gray-200 flex items-center justify-center">
        Right Space
      </div> */}
{/* <div classname ="flex flex-col items-center justify-center h-full w-full"> */}
      <div className="flex w-full max-w-md mb-4">
        <label className="block text-sm font-medium mb-2">Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className=""/>

      </div>
      <div className="absolute top-0 left-0 h-full w-[15%] bg-[#202936] flex items-center justify-center z-20 " >
        {/* <div className="">

        </div> */}
        <Columns4 onClick={toggleSidebar}
        className="sidebar-toggle top-4 right-4 cursor-pointer absolute "
        />
        <div className="top-0 left-0 flex-col items-center justify-center h-full w-full">

        <ClassList
annotations = {annotations}
onHover= {setHoveredClass}
className = "top-4 left-4 cursor-pointer absolute"

/>  

        </div>
          
 
      </div>
      <div className={`sidebar bg-white w-64 space-y-6 py-7 px-2 fixed top-0 bottom-0 left-[15%] transform ${isImageSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition duration-200 ease-in-out z-10`}>
        <h2 className="text-2xl font-semibold text-center">Image List</h2>
        <nav>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(index)}
              className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200 w-full text-left"
            >
              {image.name || `Image ${index + 1}`}
            </button>
          ))}
        </nav>
      </div>
     
      
      <div
        className="absolute left-[15%] w-[calc(85%)] h-[calc(100%)] top-[0] bottom-[0] overflow-hidden "
        ref={containerRef}
        // Removed onWheel prop to avoid passive listener issue.
        onMouseDown={(e) => { handleMouseDown(e);  }}
        onMouseUp={(e) => { handleMouseUp(e);  }}
        onMouseMove={(e) => { handleMouseMove(e); }}
      >
        
        {/* Removed the previous canvas element */}
        {/* ...existing code... */}
        
        <div
        ref = {imageContainerRef}
        style={{
            
          width: windowDimensions.width * 10,
          height: windowDimensions.height * 10,
          position: "relative",
        }}
      >

{/* {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl">Loading...</p>
          </div>
        ) :  currentImage ? (
  
            <img 
            ref = {imageRef}
              src={currentImage.url} 
              alt="Current" 
              className="max-w-full h-auto border shadow-lg"
            />
        
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl">No image selected</p>
          </div>*/}
       


       {imageSrc && (
          <img
            ref={imageRef}
            src={imageSrc}
            alt="uploaded"
            style={{
              position: "absolute",
             
              left: offset.x,
              top: offset.y,
              width: originalSizeImage.width * scale,
              height: "auto",
              pointerEvents: "none",
              userSelect: "none",
            }} />)}
         
    
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            left: cursorPos.x + 10,
            top: cursorPos.y + 10,
            fontSize: '12px',
            color: 'black',
            pointerEvents: 'none'
          }}
        >
          (X: {Math.round(relativeCursor.x)}, Y: {Math.round(relativeCursor.y)})
        </div>
        {/* Removed previous toolbar overlay from here */}
        {showAnchors && renderAnchors()}

        {showModal && (
  <AnnotationModal
    annotation={currentAnnotation}
    onSave={(className) => {
      const updatedAnnotation = { ...currentAnnotation, className };
      saveAnnotation(currentImage, updatedAnnotation);
    
      setAnnotations((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = updatedAnnotation;
        return updated;
      });
    }}
    onDelete={() => {
      // Remove the annotation if needed.
      // For example, filter it out from annotations.
      setAnnotations((prev) => 
        prev.slice(0, -1)
      );
    }}
    onClose={() => setShowModal(false)}
  />
)}
        {/* ...existing code... */}
      </div>
      </div>
      
      {/* New toolbar on main screen */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "50%",
          transform: "translateX(-30%)",
          width: "40%",
          backgroundColor: "white",
          borderRadius: "50px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 30,
          padding: "10px 0"
        }}
      >
            <button style={{ background: "none", border: "none", cursor: "pointer", fill: currentTool === 'polygon' ? 'blue' : 'black' }}
        onClick = {startEditing}
        
        >
          <Edit />
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer" }}
        onClick= {handleRectangleToolClick}
        >
          <RectangleIcon/>
          {/* <img src="src/tool_icons/rectangle.svg" alt="rectangle button" /> */}
          {/* <object data="src/tool_icons/rectangle.svg" type="image/svg+xml"/> */}
        </button>
        <button 
        onClick={handlePolygonToolClick}
        style={{ background: "none", border: "none", cursor: "pointer" }}>
          <PolygonIcon />
        </button>
    
        <button style={{ background: "none", border: "none", cursor: "pointer" }}
        onClick = {handleDeleteAnnotation}
        >
          <Delete />
        </button>
      
        <button style={{ background: "none", border: "none", cursor: "pointer" }}>
          Button 5
        </button>
      </div>

    </div>
  );
}
