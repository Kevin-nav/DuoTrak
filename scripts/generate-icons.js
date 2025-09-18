const { favicons } = require('favicons');
const path = require('path');
const fs = require('fs');

const source = path.resolve(__dirname, '../public/mascots/Notification-Mascot.png');
const destination = path.resolve(__dirname, '../public');

const configuration = {
  path: '/',
  appName: 'DuoTrak',
  appDescription: 'Shared goals and tasks dashboard for partners.',
  developerName: 'DuoTrak',
  developerURL: null,
  background: '#fff',
  theme_color: '#3AB8C2',
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    windows: true,
    yandex: false,
  },
};

const callback = function (err, response) {
  if (err) {
    console.error(err);
    return;
  }

  response.images.forEach(image => {
    fs.writeFileSync(path.join(destination, image.name), image.contents);
  });

  response.files.forEach(file => {
    fs.writeFileSync(path.join(destination, file.name), file.contents);
  });

  console.log('Favicons and app icons generated successfully!');
};

favicons(source, configuration)
  .then((response) => {
    callback(null, response);
  })
  .catch((error) => {
    callback(error, null);
  });