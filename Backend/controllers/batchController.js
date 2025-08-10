const { supabase } = require('../config/supabase');

// Create a new batch with students
const createBatch = async (req, res) => {
  try {
    const { batchName, academicYear, semester, description, students } = req.body;
    const facultyId = req.user.id;

    // Validate required fields
    if (!batchName || !academicYear || !semester || !students || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Batch name, academic year, semester, and students are required'
      });
    }

    // Create batch
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .insert({
        batch_name: batchName,
        academic_year: academicYear,
        semester: semester,
        description: description,
        faculty_id: facultyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (batchError) {
      console.error('Error creating batch:', batchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create batch',
        error: batchError.message
      });
    }

    // Create students and link them to the batch
    const studentsToInsert = students.map(student => ({
      roll_number: student.rollNumber,
      name: student.name,
      email: student.email,
      phone_number: student.phoneNumber || null,
      batch_id: batch.id,
      created_at: new Date().toISOString()
    }));

    const { data: insertedStudents, error: studentsError } = await supabase
      .from('students')
      .insert(studentsToInsert)
      .select();

    if (studentsError) {
      console.error('Error creating students:', studentsError);
      // Clean up the batch if student creation fails
      await supabase.from('batches').delete().eq('id', batch.id);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create students',
        error: studentsError.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: {
        batch,
        students: insertedStudents
      }
    });

  } catch (error) {
    console.error('Error in createBatch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all batches for the authenticated faculty
const getBatches = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const { data: batches, error } = await supabase
      .from('batches')
      .select(`
        *,
        students (
          id,
          roll_number,
          name,
          email,
          phone_number
        )
      `)
      .eq('faculty_id', facultyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching batches:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch batches',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: batches
    });

  } catch (error) {
    console.error('Error in getBatches:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a specific batch by ID
const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    const { data: batch, error } = await supabase
      .from('batches')
      .select(`
        *,
        students (
          id,
          roll_number,
          name,
          email,
          phone_number
        )
      `)
      .eq('id', id)
      .eq('faculty_id', facultyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }
      console.error('Error fetching batch:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch batch',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: batch
    });

  } catch (error) {
    console.error('Error in getBatchById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a batch
const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { batchName, academicYear, semester, description } = req.body;
    const facultyId = req.user.id;

    // Check if batch exists and belongs to faculty
    const { data: existingBatch, error: checkError } = await supabase
      .from('batches')
      .select('id')
      .eq('id', id)
      .eq('faculty_id', facultyId)
      .single();

    if (checkError || !existingBatch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const { data: batch, error } = await supabase
      .from('batches')
      .update({
        batch_name: batchName,
        academic_year: academicYear,
        semester: semester,
        description: description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating batch:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update batch',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Batch updated successfully',
      data: batch
    });

  } catch (error) {
    console.error('Error in updateBatch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a batch
const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.user.id;

    // Check if batch exists and belongs to faculty
    const { data: existingBatch, error: checkError } = await supabase
      .from('batches')
      .select('id')
      .eq('id', id)
      .eq('faculty_id', facultyId)
      .single();

    if (checkError || !existingBatch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Delete students first (due to foreign key constraint)
    const { error: studentsError } = await supabase
      .from('students')
      .delete()
      .eq('batch_id', id);

    if (studentsError) {
      console.error('Error deleting students:', studentsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete students',
        error: studentsError.message
      });
    }

    // Delete batch
    const { error: batchError } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);

    if (batchError) {
      console.error('Error deleting batch:', batchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete batch',
        error: batchError.message
      });
    }

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteBatch:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch
};
