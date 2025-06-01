import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Component to display when there is no content to show.
 * @param {object} props
 * @param {string} props.message - The message to display.
 * @param {string} [props.imageSrc] - Optional image source.
 */
const NoContent = ({ message, imageSrc }) => {
  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh">
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {message}
      </Typography>
      {imageSrc && (
        <Box component="img" src={imageSrc} alt="No content" sx={{ width: 150, height: 150, mt: 2 }} />
      )}
    </Box>
  );
};

export default NoContent; 