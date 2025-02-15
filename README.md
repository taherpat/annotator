# Image Annotation Tool - README

This project is a React-based image annotation tool that allows users to upload images, annotate them with rectangles and polygons, and manage these annotations.  It demonstrates a deep understanding of React concepts, DOM manipulation, and event handling.

### Features

*   **Image Upload:** Users can upload images for annotation.
*   **Annotation Tools:**
    *   **Rectangle:**  Draw rectangular annotations.
    *   **Polygon:** Draw polygon annotations by clicking to create vertices. Close polygons by clicking near the starting point.
*   **Pan and Zoom:**  Users can pan the image by dragging and zoom using the mouse wheel.
*   **Annotation Editing:**
    *   **Resizing:**  Annotations can be resized by dragging their anchor points (corners for rectangles, vertices for polygons).
    *   **Selection:** Click on an annotation to select it.
    *   **Deletion:**  A delete button removes the currently selected annotation.
* **Image Sidebar**:
    * Displays the list of images.
    * Allows to select and load images.
* **Class List Sidebar**:
    * Displays the list of classes from the annotations.
* **Annotation Saving**:
    * Save annotations with class names.
* **Persistence**:
    * Save annotations to the database.

### What I Learned

This project was a deep dive into several key areas of web development and React:

1.  **Component State Management (`useState`)**:
    *   Extensive use of `useState` to manage a wide range of component states, including:
        *   `windowDimensions`:  Window width and height for responsive design.
        *   `originalSizeImage`:  The original dimensions of the uploaded image.
        *   `imageSrc`: The base64 encoded image data.
        *   `cursorPos`, `relativeCursor`: Mouse positions for drawing and interaction.
        *   `scale`, `offset`:  Zoom level and panning offset.
        *   `dragStart`, `imageStartOffset`, `isDragging`:  For pan functionality.
        *   `annotations`, `currentAnnotation`, `isAnnotating`:  Core annotation data and drawing state.
        *   `selectedAnnotationIndex`:  Tracks the selected annotation.
        *   `showAnchors`: Controls the visibility of resize anchors.
        *   `resizingAnnotationIndex`, `resizingCorner`:  Manages annotation resizing.
        *   `showModal`: Controls the visibility of the annotation details modal.
        *   `images`, `loading`, `currentImage`: Manages the list of images and loading state.
        *   `isImageSidebarOpen`: Controls the visibility of the image sidebar.
        *   `hoveredClass`: Tracks the class currently hovered over in the class list.
        *   `currentTool`:  Indicates the currently active tool (pan, rectangle, polygon).

    *   Understanding how state updates trigger re-renders was crucial for smooth drawing and interaction.

2.  **Refs and the DOM (`useRef`)**:
    *   `containerRef`:  Provides a reference to the main container div, allowing access to its dimensions and event handling.
    *   `imageRef`:  Holds a reference to the `<img>` element, used for accessing image properties.
    *   `imageContainerRef`:  References the div containing the image and the annotation canvas. This is *essential* for drawing annotations directly onto the canvas.

    *   Using refs allowed direct interaction with DOM elements, bypassing React's virtual DOM when necessary (e.g., for canvas drawing).

3.  **Event Handling**:
    *   **Mouse Events:**  `onMouseDown`, `onMouseUp`, `onMouseMove`, `onWheel`.  These were the foundation of all interactions:
        *   Panning:  Calculating deltas and updating offsets.
        *   Drawing:  Tracking mouse positions to create annotation shapes.
        *   Resizing:  Updating annotation dimensions based on anchor dragging.
        *   Zooming:  Adjusting scale and offset based on wheel events.
    *   **File Input Events:**  `onChange` for handling image uploads.
    *   **Window Events:**  `resize` for adapting to window size changes.
    *   **Non-Passive Event Listeners:**  Explicitly using `{ passive: false }` for the `wheel` event to prevent browser warnings and ensure smooth zooming.

4.  **Canvas API and Drawing**:
    *   The code uses a `<div ref={imageContainerRef}>` to overlay the image and handle drawing.  This is a clever approach, as it avoids directly manipulating a `<canvas>` element, simplifying the interaction with React's rendering cycle.
    *   `drawAnnotation` and `drawPolygonAnnotation`:  Custom functions to draw rectangles and polygons on the canvas.  These functions take into account the current `scale` and `offset` to ensure annotations are drawn correctly during panning and zooming.
    *   `renderAnnotations`:  Clears and redraws *all* annotations on the canvas.  This is called whenever the annotations, scale, or offset change.  This function is crucial for maintaining visual consistency.
    *   **Transient Canvas:** A temporary canvas (`transient-annotation-canvas`) is created and removed during the drawing of each annotation. This is a good practice to avoid "flickering" and to keep the main canvas clean.

5.  **Asynchronous Operations (`useEffect`, `async/await`)**:
    *   `useEffect`:  Used extensively for:
        *   Fetching images on component mount.
        *   Redrawing annotations when state changes.
        *   Attaching and removing event listeners.
        *   Handling window resizing.
    *   `async/await`:  Used for fetching image data and converting it to base64.  This ensures that image loading is handled asynchronously, preventing the UI from freezing.

6.  **Image Handling and Base64 Encoding**:
    *   The code fetches images from signed URLs and converts them to base64 strings.  This allows the images to be displayed directly in the `<img>` tag without needing a separate server endpoint.
    *   The `FileReader` API is used to read the image file as a data URL (base64).

7.  **Coordinate Systems**:
    *   The code carefully manages multiple coordinate systems:
        *   **Window Coordinates:**  `e.clientX`, `e.clientY`.
        *   **Container Coordinates:**  Relative to the `containerRef`.
        *   **Image Coordinates:**  Relative to the original image, taking into account `scale` and `offset`.
        *   **Relative Cursor Coordinates:**  `relativeCursor`, normalized to the original image dimensions.

    *   The transformations between these coordinate systems are critical for accurate drawing and interaction.

8.  **Tool Management (`currentTool`)**:
    *   The `currentTool` state variable elegantly switches between different interaction modes (pan, rectangle, polygon).  This makes the code much more organized and maintainable than if all the logic were combined into a single set of event handlers.

9. **Component Composition**:
    * The code uses several components, including:
        * `ClassList`: Displays and manages the list of annotation classes.
        * `AnnotationModal`: A modal for entering annotation details (class name).
        * Custom tool icons (`RectangleIcon`, `PolygonIcon`, `Edit`).
    * This promotes code reusability and makes the UI more modular.

10. **Hooks (`useImageLoader`)**:
    * The `useImageLoader` hook encapsulates the logic for fetching and managing images. This demonstrates good separation of concerns and makes the main component cleaner.

### Areas for Improvement / Future Enhancements

*   **Error Handling:**  More robust error handling could be added throughout the application, especially around image loading and API calls.
*   **Accessibility:**  Consider adding ARIA attributes and keyboard navigation support for improved accessibility.
*   **Performance Optimization:**  For very large images or a large number of annotations, consider using techniques like:
    *   Debouncing or throttling event handlers.
    *   Using `requestAnimationFrame` more strategically.
    *   Offloading some calculations to web workers.
*   **Undo/Redo:**  Implement an undo/redo functionality for annotation actions.
*   **More Annotation Types:**  Add support for other annotation types (e.g., circles, lines, points).
*   **User Authentication:**  Add user authentication to allow users to save and load their own annotations.
* **Testing**: Add unit and integration tests to ensure the code works as expected.

This project provides a solid foundation for a full-featured image annotation tool. It showcases a strong understanding of React, DOM manipulation, and event handling, and it's well-structured and easy to extend.
