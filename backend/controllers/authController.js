// backend/controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = process.env;
const Admin = require("../models/Admin");
const Employee = require("../models/Employee");
const Visitor = require("../models/Visitor");
const NonEmployee = require("../models/NonEmployee");

exports.register = async (req, res) => {
  try {
    const {
      userType,
      empID,
      name,
      email,
      nic,
      telNo,
      address,
      vehicleNo,
      password,
      permitType,
      vehicleType,
    } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    let model;

    if (userType === "employee") model = Employee;
    else if (userType === "nonemployee") model = NonEmployee;
    else if (userType === "visitor") model = Visitor;
    else return res.status(400).json({ message: "Invalid user type" });

    if (await model.findOne({ email }))
      return res.status(400).json({ message: "Email already exists" });
    if (userType === "employee" && empID && (await model.findOne({ empID })))
      return res.status(400).json({ message: "Employee ID exists" });
    if (await model.findOne({ nic }))
      return res.status(400).json({ message: "NIC already exists" });

    // --- AUTO-GENERATE IDs FOR VISITOR AND NONEMPLOYEE ---
    let userData = {
      empID,
      name,
      email,
      nic,
      telNo,
      address,
      vehicleNo,
      permitType,
      vehicleType,
      password: hashed,
    };

    if (userType === "visitor") {
      const lastVisitor = await Visitor.findOne().sort({ createdAt: -1 });
      const lastID = lastVisitor?.visitorID?.split("VS")[1] || "000";
      const nextID = `VS${String(parseInt(lastID) + 1).padStart(3, "0")}`;
      userData.visitorID = nextID;
    }

    if (userType === "nonemployee") {
      const lastNonEmp = await NonEmployee.findOne().sort({ createdAt: -1 });
      const lastID = lastNonEmp?.nonEmployeeID?.split("NE")[1] || "000";
      const nextID = `NE${String(parseInt(lastID) + 1).padStart(3, "0")}`;
      userData.nonEmployeeID = nextID;
    }

    const user = await model.create(userData);

    res
      .status(201)
      .json({ message: "Registered, pending approval", userId: user._id });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    let Model;
    switch (userType) {
      case "admin":
        Model = Admin;
        break;
      case "employee":
        Model = Employee;
        break;
      case "nonemployee":
        Model = NonEmployee;
        break;
      case "visitor":
        Model = Visitor;
        break;
      default:
        return res.status(400).json({ message: "Invalid user type" });
    }

    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (userType !== "admin" && user.status !== "approved") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: userType }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: userType,
    };

    //  Include empID if employee
    if (userType === "employee" && user.empID) {
      userResponse.empID = user.empID;
    }

    res.json({
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let profileData = null;

    if (userRole === "employee") {
      profileData = await Employee.findById(userId)
        .populate("permits")
        .populate("violations");
    } else if (userRole === "admin") {
      profileData = await Admin.findById(userId);
    } else if (userRole === "visitor") {
      profileData = await Visitor.findById(userId).populate("permits");
    } else if (userRole === "nonemployee") {
      profileData = await NonEmployee.findById(userId).populate("permits");
    }

    if (!profileData) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const userProfile = {
      _id: profileData._id,
      role: profileData.role,
      name: profileData.name,
      email: profileData.email,
      ...(profileData.empID && { empID: profileData.empID }),
      ...(profileData.nic && { nic: profileData.nic }),
      ...(profileData.telNo && { telNo: profileData.telNo }),
      ...(profileData.address && { address: profileData.address }),
      ...(profileData.vehicleNo && { vehicleNo: profileData.vehicleNo }),
      ...(profileData.vehicleType && { vehicleType: profileData.vehicleType }),
      ...(profileData.permitType && { permitType: profileData.permitType }),
      permits: profileData.permits || [],
      violations: profileData.violations || [],
    };

    res.status(200).json({ user: userProfile });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    res.status(500).json({ message: "Server error fetching user profile" });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};
