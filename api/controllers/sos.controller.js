import SOSContact from "../models/sos.model.js";
import { errorHandler } from "../utils/error.js";

// ── GET /api/sos/contacts
export const getSOSContacts = async (req, res, next) => {
  try {
    const contacts = await SOSContact.find({
      user: req.user._id,
      isActive: true,
    }).sort({ priority: 1, createdAt: 1 });

    return res.status(200).json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/sos/contacts
export const addSOSContact = async (req, res, next) => {
  try {
    const { name, phone, relationship, priority, sendLocation, customMessage } = req.body;

    console.log("1 - destructured");

    if (!name || !phone) {
      return next(errorHandler(400, "Name and phone number are required"));
    }

    console.log("2 - validation passed");

    const existing = await SOSContact.findOne({
      user: req.user._id,
      phone,
      isActive: true,
    });

    console.log("3 - duplicate check done");

    if (existing) {
      return next(errorHandler(400, "This phone number is already an SOS contact"));
    }

    console.log("4 - creating contact");

    const contact = await SOSContact.create({
      user: req.user._id,
      name,
      phone,
      relationship: relationship || "other",
      priority: priority || 1,
      sendLocation: sendLocation !== undefined ? sendLocation : true,
      customMessage: customMessage || null,
    });

    console.log("5 - contact created");

    return res.status(201).json({
      success: true,
      message: "SOS contact added successfully",
      contact,
    });

  } catch (error) {
    console.log("CAUGHT ERROR:", error.message, error);
    next(error);
  }
};

// ── PUT /api/sos/contacts/:id
export const updateSOSContact = async (req, res, next) => {
  try {
    const contact = await SOSContact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return next(errorHandler(404, "SOS contact not found"));
    }

    const { name, phone, relationship, priority, sendLocation, customMessage } = req.body;

    const updated = await SOSContact.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(relationship && { relationship }),
          ...(priority && { priority }),
          ...(sendLocation !== undefined && { sendLocation }),
          ...(customMessage !== undefined && { customMessage }),
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "SOS contact updated",
      contact: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/sos/contacts/:id
export const deleteSOSContact = async (req, res, next) => {
  try {
    const contact = await SOSContact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return next(errorHandler(404, "SOS contact not found"));
    }

    await SOSContact.findByIdAndUpdate(req.params.id, {
      $set: { isActive: false },
    });

    return res.status(200).json({
      success: true,
      message: "SOS contact removed",
    });
  } catch (error) {
    next(error);
  }
};