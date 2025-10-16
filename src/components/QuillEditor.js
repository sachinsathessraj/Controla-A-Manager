import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const QuillEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
            [{ size: [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, 
             {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image', 'video'],
            ['clean']
          ],
        },
        placeholder,
      });

      const quill = quillRef.current;
      quill.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          onChange(quill.root.innerHTML);
        }
      });

      // Set initial value
      if (value) {
        const delta = quill.clipboard.convert(value);
        quill.setContents(delta, 'silent');
      }
    }
  }, [placeholder, value, onChange]);

  // Handle external value changes
  useEffect(() => {
    const quill = quillRef.current;
    if (quill && value !== quill.root.innerHTML) {
      const delta = quill.clipboard.convert(value);
      quill.setContents(delta, 'silent');
    }
  }, [value]);

  return <div ref={editorRef} style={{ backgroundColor: 'white' }} />;
};

export default QuillEditor;
