import qrcode

# URL to encode
url = "https://lvjstregister.netlify.app/"

# Create QR object
qr = qrcode.QRCode(
    version=1,  # controls size (1 = small, higher = bigger)
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,  # size of each box
    border=4,     # quiet zone
)

qr.add_data(url)
qr.make(fit=True)

# Create image
img = qr.make_image(fill_color="black", back_color="white")

# Save file
file_name = "lvjst_register_qr.png"
img.save(file_name)

print(f"QR code generated successfully: {file_name}")
