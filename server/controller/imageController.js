import userModel from "../models/userModel.js";
import FormData from 'form-data';
import axios from 'axios';

const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id; // ✅ Extracted from authenticated token

    if (!userId || !prompt) {
      return res.json({ success: false, message: 'Missing Details' });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    if (user.creditBalance <= 0) {
      return res.json({ success: false, message: "No credit Balance", creditBalance: user.creditBalance });
    }

    const formData = new FormData();
    formData.append('prompt', prompt);

    const { data } = await axios.post(
      'https://clipdrop-api.co/text-to-image/v1',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': process.env.CLIPDROP_API,
        },
        responseType: 'arraybuffer'
      }
    );

    const base64Image = Buffer.from(data, 'binary').toString('base64');
    const resultImage = `data:image/png;base64,${base64Image}`;

    await userModel.findByIdAndUpdate(user._id, {
      creditBalance: user.creditBalance - 1
    });

    res.json({
      success: true,
      message: "Image Generated",
      creditBalance: user.creditBalance - 1,
      resultImage
    });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export default generateImage;
