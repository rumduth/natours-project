//Createing class of API
class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString; //it is req.query. THe query server received from client
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // let query = Tour.find(JSON.parse(queryStr));
    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // 2) Sorting
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort.replaceAll(',', ' ');
      this.query = this.query.sort(sortBy);
      //in mongoose if we want to sort something, follow the format .sort(A B  C D);
    } else {
      this.query = this.query.sort('-createdAt');
      //just enter the sort field inside the sort function, mongoose will sort from then
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      let fields = this.queryString.fields.replaceAll(',', ' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // to exclude the version field from the response
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments(); //count documents int tour database
    //   if (skip >= numTours) throw 'This page is not exixt';
    // }
    //page=2&limit=10, 1-10: page1, 11-20: page2
    this.query = this.query.skip(skip).limit(limit); //skip 10 result, and get up to 10 (limit resourse)
    //imagine skip and limit are top help us extract the data when sorted, like get 5 cheapest prices
    return this;
  }
}

module.exports = APIfeatures;
